import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PREMIUM_PRICE_EUR, COST_PER_CALL_EUR, TOTAL_INFRA_MONTHLY_EUR } from "@/lib/pricing-constants";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Zap,
  CreditCard, Server, Bot, Brain,
  Activity
} from "lucide-react";
import "../analytics/analytics.css";
import CostBreakdownChart from "./components/CostBreakdownChart";
import MonthlyBurnChart from "./components/MonthlyBurnChart";
import {
  buildSubscriptionChannelBenchmarks,
  calculateAfterTaxProfit,
  calculateSubscriptionUnitEconomics,
  CONSERVATIVE_PREMIUM_CHANNEL_KEY,
  PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE,
  PORTUGAL_VAT_RATE,
} from "@/lib/subscription-economics";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

type MonthRow = { month: string; count: number; tokens: number };

async function getFinancialsData() {
  const supabase = getSupabaseAdmin();

  const [
    walletsRes,
    ledgerByMonthRes,
    doubtsRes,
    examSubmissionsRes,
    totalUsersRes,
  ] = await Promise.all([
    // User wallets by plan
    supabase.rpc("get_wallet_summary_by_plan"),
    // Token ledger by month
    supabase.rpc("get_ledger_summary_by_month"),
    // Doubt events total
    supabase.from("quiz_doubt_events").select("id", { count: "exact", head: true }),
    // Exam submissions graded
    supabase.from("exame_submissions").select("id", { count: "exact", head: true }).eq("status", "graded"),
    // Total auth users (profiles count)
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
  ]);

  // Fallback: if RPCs don't exist yet, query directly
  let walletsByPlan: { plan_code: string; user_count: number; total_lifetime: number }[] = [];
  if (walletsRes.error || !walletsRes.data) {
    const { data } = await supabase
      .from("user_token_wallets")
      .select("plan_code, lifetime_used_tokens");
    if (data) {
      const map = new Map<string, { count: number; lifetime: number }>();
      for (const row of data) {
        const existing = map.get(row.plan_code) || { count: 0, lifetime: 0 };
        map.set(row.plan_code, {
          count: existing.count + 1,
          lifetime: existing.lifetime + (row.lifetime_used_tokens || 0),
        });
      }
      walletsByPlan = Array.from(map.entries()).map(([plan_code, v]) => ({
        plan_code,
        user_count: v.count,
        total_lifetime: v.lifetime,
      }));
    }
  } else {
    walletsByPlan = walletsRes.data;
  }

  let aiCostsView: {
    action_key: string;
    model: string;
    event_count: number;
    total_braincells: number;
    total_input_tokens: number | null;
    total_output_tokens: number | null;
  }[] = [];
  const { data: viewData } = await supabase.from("vw_ai_costs_by_action").select("*");
  if (viewData) aiCostsView = viewData;

  let ledgerByMonth: MonthRow[] = [];
  if (ledgerByMonthRes.error || !ledgerByMonthRes.data) {
    const { data } = await supabase
      .from("user_token_ledger")
      .select("created_at, tokens_delta")
      .order("created_at", { ascending: true });
    if (data) {
      const map = new Map<string, { count: number; tokens: number }>();
      for (const row of data) {
        const month = row.created_at.substring(0, 7); // YYYY-MM
        const existing = map.get(month) || { count: 0, tokens: 0 };
        map.set(month, {
          count: existing.count + 1,
          tokens: existing.tokens + Math.abs(row.tokens_delta || 0),
        });
      }
      ledgerByMonth = Array.from(map.entries()).map(([month, v]) => ({
        month,
        count: v.count,
        tokens: v.tokens,
      }));
    }
  } else {
    ledgerByMonth = ledgerByMonthRes.data;
  }

  // Compute derived metrics
  const premiumUsers = walletsByPlan.find(w => w.plan_code === "premium")?.user_count || 0;
  const freeUsers = walletsByPlan.find(w => w.plan_code === "free")?.user_count || 0;
  const totalWalletUsers = walletsByPlan.reduce((a, w) => a + w.user_count, 0);
  const totalUsers = totalUsersRes.count || totalWalletUsers;

  // Revenue
  const premiumRevenueUnit = calculateSubscriptionUnitEconomics(
    PREMIUM_PRICE_EUR,
    CONSERVATIVE_PREMIUM_CHANNEL_KEY,
  );
  const channelBenchmarks = buildSubscriptionChannelBenchmarks(PREMIUM_PRICE_EUR);
  const grossMonthlyRevenue = premiumUsers * PREMIUM_PRICE_EUR;
  const vatOnSubscriptions = premiumUsers * premiumRevenueUnit.vatComponentEur;
  const storeFeesOnSubscriptions = premiumUsers * premiumRevenueUnit.storeFeeEur;
  const monthlyRevenue = premiumUsers * premiumRevenueUnit.platformProceedsPreTaxEur;

  // AI costs by feature (Precise Token Calculation)
  // We use the new View which groups by action_key and model.
  const { MODEL_PRICING_EUR } = await import("@/lib/pricing-constants");

  const aiCostBreakdown = aiCostsView
    .filter(a => !a.action_key.includes("refund"))
    .map(a => {
      const fallbackConfig = COST_PER_CALL_EUR[a.action_key];
      const fallbackModel = fallbackConfig?.model || "unknown";
      
      const modelKey = a.model || fallbackModel;
      const exactPricing = MODEL_PRICING_EUR[modelKey];
      
      let totalCost = 0;
      
      if (exactPricing && a.total_input_tokens !== null && a.total_output_tokens !== null) {
        // High-precision tracking
        totalCost = (a.total_input_tokens / 1_000_000 * exactPricing.inputPer1M) + 
                    (a.total_output_tokens / 1_000_000 * exactPricing.outputPer1M);
      } else {
        // Legacy fallback estimation for old rows without token metadata
        const costPerCall = fallbackConfig?.cost || 0.001;
        totalCost = a.event_count * costPerCall;
      }
      
      return {
        action_key: a.action_key,
        label: fallbackConfig?.description || a.action_key,
        model: modelKey,
        event_count: a.event_count,
        braincells_consumed: a.total_braincells,
        estimated_cost_eur: totalCost,
        is_exact: a.total_input_tokens !== null,
      };
    })
    .sort((a, b) => b.estimated_cost_eur - a.estimated_cost_eur);

  // Exam grading cost (untracked in ledger but we know from submissions)
  const examGradedCount = examSubmissionsRes.count || 0;
  const examGradingCost = examGradedCount * (COST_PER_CALL_EUR.grade_exam?.cost || 0.004);

  // Total AI cost
  const totalUserAiCostEur = aiCostBreakdown.reduce((a, b) => a + b.estimated_cost_eur, 0);
  const totalAiCost = totalUserAiCostEur + examGradingCost;

  // Burn rate
  const totalMonthlyCost = totalAiCost + TOTAL_INFRA_MONTHLY_EUR;
  const pretaxNetMonthly = monthlyRevenue - totalMonthlyCost;
  const { estimatedCorporateTaxEur, afterTaxProfitEur } = calculateAfterTaxProfit(
    pretaxNetMonthly,
  );

  // Unit economics
  const costPerActiveUser = totalUsers > 0 ? totalMonthlyCost / totalUsers : 0;
  const revenuePerUser = totalUsers > 0 ? monthlyRevenue / totalUsers : 0;

  // Free Tier Impact Analysis
  // 50 Braincells/day * 30 days = 1500 Braincells/month max capacity
  // 1 Braincell ≈ €0.00012 (e.g. quick_doubt 0.0012 / 10)
  const AVG_COST_PER_BRAINCELL_EUR = 0.00012;
  const braincellsPerFreeUserMonthly = 50 * 30;
  const maxCostPerFreeUserMonthly = braincellsPerFreeUserMonthly * AVG_COST_PER_BRAINCELL_EUR; // ~€0.18
  const totalFreeTierLiabilityMonthly = freeUsers * maxCostPerFreeUserMonthly;
  const freeTierCoverageRatio = maxCostPerFreeUserMonthly > 0
    ? Math.max(0, Math.floor(premiumRevenueUnit.platformProceedsPreTaxEur / maxCostPerFreeUserMonthly))
    : 0;

  return {
    // Users
    totalUsers,
    premiumUsers,
    freeUsers,
    // Revenue
    grossMonthlyRevenue,
    vatOnSubscriptions,
    storeFeesOnSubscriptions,
    monthlyRevenue,
    premiumRevenueUnit,
    channelBenchmarks,
    // Costs
    aiCostBreakdown,
    totalUserAiCostEur,
    examGradedCount,
    examGradingCost,
    totalAiCost,
    infraCost: TOTAL_INFRA_MONTHLY_EUR,
    totalMonthlyCost,
    // Economics
    costPerActiveUser,
    revenuePerUser,
    pretaxNetMonthly,
    estimatedCorporateTaxEur,
    netMonthly: afterTaxProfitEur,
    // Monthly trend
    ledgerByMonth,
    // Counts
    totalDoubts: doubtsRes.count || 0,
    // Free Tier Analysis
    avgCostPerBraincell: AVG_COST_PER_BRAINCELL_EUR,
    maxCostPerFreeUserMonthly,
    totalFreeTierLiabilityMonthly,
    freeTierCoverageRatio,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function eur(value: number, decimals = 2): string {
  return `€${value.toFixed(decimals)}`;
}

function eurSm(value: number): string {
  return value < 0.01 ? `€${value.toFixed(4)}` : eur(value);
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function FinancialsPage() {
  const d = await getFinancialsData();

  const isProfit = d.netMonthly >= 0;

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1 className="analytics-title">💰 Financeiro Hub</h1>
        <p className="analytics-subtitle">
          Custos reais com IA, revenue, burn rate e unit economics do Wolfi.
        </p>
      </header>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          label="Receita Líquida Plataforma"
          value={eur(d.monthlyRevenue)}
          sub={`${d.premiumUsers} premium · conservador ${d.premiumRevenueUnit.channelLabel}`}
          icon={<TrendingUp size={24} />}
          color="#34d399"
          deltaType="positive"
        />
        <KpiCard
          label="Custos IA (Total)"
          value={eur(d.totalAiCost, 4)}
          sub={`${d.aiCostBreakdown.reduce((a, b) => a + b.event_count, 0)} chamadas API`}
          icon={<Brain size={24} />}
          color="#fbbf24"
        />
        <KpiCard
          label="Net Mensal Pós-Imposto"
          value={eur(d.netMonthly, 2)}
          sub={isProfit ? "Lucro estimado ✓" : "Prejuízo estimado ⚠️"}
          icon={isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          color={isProfit ? "#34d399" : "#f87171"}
          deltaType={isProfit ? "positive" : "negative"}
        />
        <KpiCard
          label="Custo / User"
          value={eurSm(d.costPerActiveUser)}
          sub={`${d.totalUsers} users totais`}
          icon={<Users size={24} />}
          color="#60a5fa"
        />
      </div>

      {/* ── Visual Charts & Deep Dive ────────────────────────── */}
      <div className="charts-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        {/* Cost Breakdown Chart */}
        <div className="glass-card">
          <div className="chart-header">
            <h2 className="chart-title"><Zap size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Distribuição de Custos IA</h2>
          </div>
          <CostBreakdownChart data={d.aiCostBreakdown} />
        </div>

        {/* P&L & Unit Economics */}
        <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
          <div className="glass-card">
            <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <DollarSign size={18} style={{ color: "var(--accent)" }} />
              P&L Mensal
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              <MetricRow label="Faturação bruta" value={eur(d.grossMonthlyRevenue)} />
              <MetricRow label="IVA PT (23%)" value={`-${eur(d.vatOnSubscriptions)}`} valueColor="#f87171" />
              <MetricRow label={`Store fees (${Math.round(d.premiumRevenueUnit.storeFeeRate * 100)}%)`} value={`-${eur(d.storeFeesOnSubscriptions)}`} valueColor="#f87171" />
              <MetricRow label="Receita líquida plataforma" value={eur(d.monthlyRevenue)} valueColor="#34d399" highlight />
              <MetricRow label="Custos IA (User-facing)" value={`-${eur(d.totalUserAiCostEur, 4)}`} valueColor="#f87171" />
              <MetricRow label="Custos IA (Exam Grading)" value={`-${eur(d.examGradingCost, 4)}`} valueColor="#f87171" />
              <MetricRow label="Infraestrutura" value={`-${eur(d.infraCost)}`} valueColor="#f87171" />
              <MetricRow label="Resultado pré-imposto" value={eur(d.pretaxNetMonthly, 2)} valueColor={d.pretaxNetMonthly >= 0 ? "#34d399" : "#f87171"} />
              <MetricRow label={`IRC estimado (${(PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE * 100).toFixed(1)}%)`} value={`-${eur(d.estimatedCorporateTaxEur, 2)}`} valueColor="#f87171" />
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, marginTop: 4 }}>
                <MetricRow
                  label="Net pós-imposto"
                  value={eur(d.netMonthly, 2)}
                  valueColor={isProfit ? "#34d399" : "#f87171"}
                  highlight
                />
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} style={{ color: "#60a5fa" }} />
              Unit Economics
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              <MetricRow label="Revenue por User" value={eurSm(d.revenuePerUser)} />
              <MetricRow label="Custo IA por User" value={eurSm(d.costPerActiveUser)} />
              <MetricRow
                label="Margem pré-imposto / User"
                value={eurSm(d.revenuePerUser - d.costPerActiveUser)}
                valueColor={d.revenuePerUser >= d.costPerActiveUser ? "#34d399" : "#f87171"}
              />
              <MetricRow label="Custo médio por dúvida IA" value={d.totalDoubts > 0 ? eurSm(d.totalUserAiCostEur / d.totalDoubts) : "—"} />
              <MetricRow
                label="Premium necessários p/ breakeven"
                value={
                  d.premiumRevenueUnit.platformProceedsPreTaxEur > 0
                    ? String(Math.ceil(d.totalMonthlyCost / d.premiumRevenueUnit.platformProceedsPreTaxEur))
                    : "0"
                }
              />
            </div>
          </div>

          {/* Free Tier Impact Analysis */}
          <div className="glass-card">
            <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={18} style={{ color: "#facc15" }} />
              Impacto do Plano Free
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              <MetricRow label="Quota Diária" value="50 Braincells" badge="~1500/mês" />
              <MetricRow label="Custo Máximo/User Diário" value={eurSm(d.maxCostPerFreeUserMonthly / 30)} />
              <MetricRow label="Custo Máximo/User Mensal" value={eurSm(d.maxCostPerFreeUserMonthly)} highlight valueColor="#facc15" />
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, marginTop: 4 }}>
                <MetricRow label="Risco Total (100% Usage)" value={eur(d.totalFreeTierLiabilityMonthly, 2)} valueColor="#f87171" badge={`Baseado em ${d.freeUsers} free users`} />
                <MetricRow label="Cobertura Premium vs Free" value={`1 Premium : ${d.freeTierCoverageRatio} Free`} badge="após IVA + store fee" />
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: "rgba(52, 211, 153, 0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#6ee7b7" }}>
                💡 O modelo conservador assume preço ao consumidor com IVA PT incluído e fee de loja do cenário mais caro para Premium.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly Burn & Tables ───────────────────────────── */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: d.ledgerByMonth.length > 0 ? "1fr 1fr" : "1fr", marginBottom: 48 }}>
        {/* Token Burn Area Chart */}
        {d.ledgerByMonth.length > 0 && (
          <div className="glass-card">
            <div className="chart-header">
              <h2 className="chart-title"><Activity size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Burn Rate Mensal (Braincells)</h2>
            </div>
            <MonthlyBurnChart data={d.ledgerByMonth} />
          </div>
        )}

        {/* Revenue Breakdown */}
        <div className="glass-card" style={{ alignSelf: 'start' }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={18} style={{ color: "#34d399" }} />
            Detalhe de Revenue
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            <MetricRow label="Premium Users" value={String(d.premiumUsers)} badge={`× ${eur(PREMIUM_PRICE_EUR)}/mês`} />
            <MetricRow label="Free Users" value={String(d.freeUsers)} badge="€0 revenue" />
            <MetricRow label="Conversão Free→Premium" value={d.totalUsers > 0 ? `${Math.round((d.premiumUsers / d.totalUsers) * 100)}%` : "0%"} />
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, marginTop: 4 }}>
              <MetricRow label="Faturação Bruta" value={eur(d.grossMonthlyRevenue)} />
              <MetricRow label="Receita Líquida Plataforma" value={eur(d.monthlyRevenue)} highlight />
            </div>
          </div>
          
          <h3 style={{ margin: "32px 0 20px", fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Server size={18} style={{ color: "var(--muted)" }} />
            Infraestrutura
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            <MetricRow label="Supabase" value="€0 (Free Plan)" />
            <MetricRow label="Edge Functions" value="Free (500K inv/mês)" />
            <MetricRow label="Gemini API" value="Pay-per-use" />
          </div>
          <div style={{ marginTop: 16, padding: 12, background: "rgba(245, 158, 11, 0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#fcd34d" }}>
              ⚠️ O plano Free do Supabase tem limite de 500MB DB e 2GB bandwidth. Monitorize antes de escalar.
            </p>
          </div>
        </div>
      </div>

      <section className="glass-card" style={{ marginBottom: 24 }}>
        <div className="chart-header">
          <h2 className="chart-title">
            <CreditCard size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Premissas de Stores e Fiscalidade
          </h2>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <MetricRow label="IVA modelado" value={`${Math.round(PORTUGAL_VAT_RATE * 100)}%`} badge="Portugal Continental" />
          <MetricRow label="Imposto sobre lucro modelado" value={`${(PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE * 100).toFixed(1)}%`} badge="IRC 19% + derrama municipal 1.5%" />
          <MetricRow label="Canal conservador Premium" value={d.premiumRevenueUnit.channelLabel} badge={`${Math.round(d.premiumRevenueUnit.storeFeeRate * 100)}% fee`} />
        </div>
        <div className="glass-table-wrapper" style={{ marginTop: 16 }}>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Canal</th>
                <th style={{ textAlign: "right" }}>Preço bruto</th>
                <th style={{ textAlign: "right" }}>IVA</th>
                <th style={{ textAlign: "right" }}>Fee loja</th>
                <th style={{ textAlign: "right" }}>Receita líquida</th>
              </tr>
            </thead>
            <tbody>
              {d.channelBenchmarks.map((channel) => (
                <tr key={channel.channelKey}>
                  <td>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong>{channel.channelLabel}</strong>
                      <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{channel.channelNote}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(channel.grossPriceEur)}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#f87171" }}>-{eur(channel.vatComponentEur)}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#f87171" }}>-{eur(channel.storeFeeEur)}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#34d399" }}>{eur(channel.platformProceedsPreTaxEur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Cost Breakdown Detailed Table */}
      <section className="glass-card">
        <div className="chart-header">
          <h2 className="chart-title"><Bot size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Custos de IA Detalhados</h2>
        </div>
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Feature / Action</th>
                <th>Modelo</th>
                <th style={{ textAlign: "right" }}>Chamadas</th>
                <th style={{ textAlign: "right" }}>🧠 Braincells</th>
                <th style={{ textAlign: "right", color: 'var(--accent-strong)' }}>Custo Est. €</th>
              </tr>
            </thead>
            <tbody>
              {d.aiCostBreakdown.map(row => (
                <tr key={row.action_key}>
                  <td className="bold-cell">{row.label}</td>
                  <td><span className="badge-date" style={{ color: 'var(--text)', background: 'rgba(255,255,255,0.05)' }}>{row.model}</span></td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.event_count.toLocaleString('pt-PT')}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: 'var(--muted)' }}>{row.braincells_consumed.toLocaleString('pt-PT')}</td>
                  <td className="bold-cell" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: '#fbbf24' }}>
                    {eurSm(row.estimated_cost_eur)}
                  </td>
                </tr>
              ))}
              {/* Exam grading untracked */}
              {d.examGradedCount > 0 && (
                <tr>
                  <td className="bold-cell">Exam Grading</td>
                  <td><span className="badge-date" style={{ color: 'var(--text)', background: 'rgba(255,255,255,0.05)' }}>gemini-2.0-flash</span></td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.examGradedCount.toLocaleString('pt-PT')}</td>
                  <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                  <td className="bold-cell" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: '#fbbf24' }}>{eurSm(d.examGradingCost)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ fontWeight: 700, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>Total Custos IA Computados</td>
                <td style={{ textAlign: "right", fontWeight: 800, color: "#f87171", paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>{eur(d.totalAiCost, 4)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({ label, value, sub, icon, color, deltaType }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string; deltaType?: "positive" | "negative";
}) {
  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span className="kpi-label" style={{ marginBottom: 0 }}>
          {label}
        </span>
        <span style={{ color, opacity: 0.9 }}>{icon}</span>
      </div>
      <div>
        <span className="kpi-value">{value}</span>
        <div className="kpi-delta-wrapper" style={{ marginTop: 4 }}>
          {deltaType ? (
            <span className={`kpi-delta ${deltaType}`}>{sub}</span>
          ) : (
            <span style={{ fontSize: "0.85rem", color: "var(--muted-soft)" }}>{sub}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, badge, highlight, valueColor }: {
  label: string; value: string; badge?: string; highlight?: boolean; valueColor?: string;
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: highlight ? "8px 12px" : "0",
      background: highlight ? "rgba(255,255,255,0.03)" : "transparent",
      borderRadius: highlight ? "var(--radius-sm)" : undefined,
    }}>
      <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: highlight ? 600 : 400 }}>
        {label}
        {badge && <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "var(--muted-soft)" }}>{badge}</span>}
      </span>
      <span style={{
        fontSize: highlight ? "1.1rem" : "0.9rem",
        fontWeight: highlight ? 700 : 600,
        fontVariantNumeric: "tabular-nums",
        color: valueColor || "var(--text)",
      }}>
        {value}
      </span>
    </div>
  );
}
