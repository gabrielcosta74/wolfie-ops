import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PREMIUM_PRICE_EUR, COST_PER_CALL_EUR } from "@/lib/pricing-constants";
import { Users, Crown, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  calculateAfterTaxProfit,
  calculateSubscriptionUnitEconomics,
  CONSERVATIVE_PREMIUM_CHANNEL_KEY,
} from "@/lib/subscription-economics";

export const dynamic = "force-dynamic";

async function getUserEconomicsData() {
  const supabase = getSupabaseAdmin();

  // Get all wallets with profile data
  const { data: wallets } = await supabase
    .from("user_token_wallets")
    .select("user_id, plan_code, status, monthly_quota_tokens, monthly_used_tokens, daily_limit_tokens, lifetime_used_tokens, bonus_balance, period_started_at, updated_at");

  // Get profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, name, level, xp_total, last_activity, created_at");

  // Get token ledger aggregated per user
  const { data: ledger } = await supabase
    .from("user_token_ledger")
    .select("user_id, action_key, tokens_delta, meta");

  // Get session count per user
  const { data: sessions } = await supabase
    .from("quiz_sessoes")
    .select("user_id");

  // Get doubt count per user
  const { data: doubts } = await supabase
    .from("quiz_doubt_events")
    .select("user_id, tokens_spent");

  // Aggregate ledger by user
  const { MODEL_PRICING_EUR } = await import("@/lib/pricing-constants");
  const premiumRevenueUnit = calculateSubscriptionUnitEconomics(
    PREMIUM_PRICE_EUR,
    CONSERVATIVE_PREMIUM_CHANNEL_KEY,
  );

  const ledgerByUser = new Map<string, { totalCalls: number; totalCost: number; byAction: Record<string, number> }>();
  for (const entry of (ledger || [])) {
    if (entry.tokens_delta > 0) continue; // skip refunds
    const existing = ledgerByUser.get(entry.user_id) || { totalCalls: 0, totalCost: 0, byAction: {} };
    
    const inputT = Number(entry.meta?.provider_input_tokens);
    const outputT = Number(entry.meta?.provider_output_tokens);
    const model = entry.meta?.provider_model;
    
    let cost = 0;
    if (!isNaN(inputT) && !isNaN(outputT) && model && MODEL_PRICING_EUR[model]) {
       const pricing = MODEL_PRICING_EUR[model];
       cost = (inputT / 1_000_000 * pricing.inputPer1M) + (outputT / 1_000_000 * pricing.outputPer1M);
    } else {
       // Legacy fallback
       const costInfo = COST_PER_CALL_EUR[entry.action_key];
       cost = costInfo?.cost || 0.001;
    }
    
    existing.totalCalls += 1;
    existing.totalCost += cost;
    existing.byAction[entry.action_key] = (existing.byAction[entry.action_key] || 0) + 1;
    ledgerByUser.set(entry.user_id, existing);
  }

  // Session count by user
  const sessionsByUser = new Map<string, number>();
  for (const s of (sessions || [])) {
    sessionsByUser.set(s.user_id, (sessionsByUser.get(s.user_id) || 0) + 1);
  }

  // Doubt count by user
  const doubtsByUser = new Map<string, { count: number; tokens: number }>();
  for (const d of (doubts || [])) {
    const existing = doubtsByUser.get(d.user_id) || { count: 0, tokens: 0 };
    existing.count += 1;
    existing.tokens += d.tokens_spent || 0;
    doubtsByUser.set(d.user_id, existing);
  }

  // Build user list
  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
  const allUserIds = new Set([
    ...(wallets || []).map(w => w.user_id),
    ...(profiles || []).map(p => p.user_id),
  ]);

  const users = Array.from(allUserIds).map(userId => {
    const wallet = (wallets || []).find(w => w.user_id === userId);
    const profile = profileMap.get(userId);
    const ledgerData = ledgerByUser.get(userId);
    const sessionCount = sessionsByUser.get(userId) || 0;
    const doubtData = doubtsByUser.get(userId);

    const plan = wallet?.plan_code || "free";
    const grossRevenue = plan === "premium" ? PREMIUM_PRICE_EUR : 0;
    const revenue =
      plan === "premium" ? premiumRevenueUnit.platformProceedsPreTaxEur : 0;
    const aiCost = ledgerData?.totalCost || 0;
    const pretaxMargin = revenue - aiCost;
    const afterTaxMargin = calculateAfterTaxProfit(pretaxMargin).afterTaxProfitEur;

    return {
      userId,
      name: profile?.name || "Sem nome",
      plan,
      level: profile?.level || 1,
      xp: profile?.xp_total || 0,
      lifetimeTokens: wallet?.lifetime_used_tokens || 0,
      monthlyUsed: wallet?.monthly_used_tokens || 0,
      monthlyQuota: wallet?.monthly_quota_tokens || 0,
      aiCalls: ledgerData?.totalCalls || 0,
      aiCostEur: aiCost,
      grossRevenueEur: grossRevenue,
      revenueEur: revenue,
      marginEur: pretaxMargin,
      afterTaxMarginEur: afterTaxMargin,
      sessions: sessionCount,
      doubts: doubtData?.count || 0,
      lastActivity: profile?.last_activity || wallet?.updated_at || null,
      createdAt: profile?.created_at || null,
    };
  }).sort((a, b) => b.aiCostEur - a.aiCostEur);

  const totalRevenue = users.reduce((a, u) => a + u.revenueEur, 0);
  const totalCost = users.reduce((a, u) => a + u.aiCostEur, 0);

  return { users, totalRevenue, totalCost };
}

function eur(value: number): string {
  return value < 0.01 && value > 0 ? `€${value.toFixed(4)}` : `€${value.toFixed(2)}`;
}

export default async function PerUserEconomicsPage() {
  const { users, totalRevenue, totalCost } = await getUserEconomicsData();
  const premiumCount = users.filter(u => u.plan === "premium").length;
  const freeCount = users.length - premiumCount;

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: 32 }}>
        <Link href="/manager/financials" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12, transition: "color 0.2s" }}>
          <ArrowLeft size={14} /> Financeiro
        </Link>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          👤 Per-User Economics
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--muted)" }}>
          Custo e receita líquida por utilizador, já com desconto conservador de IVA e store fee nas subscrições premium.
        </p>
      </header>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <SummaryCard label="Total Users" value={String(users.length)} icon={<Users size={18} />} color="var(--info)" />
        <SummaryCard label="Premium" value={String(premiumCount)} icon={<Crown size={18} />} color="var(--success)" />
        <SummaryCard label="Free" value={String(freeCount)} icon={<User size={18} />} color="var(--muted)" />
        <SummaryCard label="Revenue Total" value={eur(totalRevenue)} icon={<Crown size={18} />} color="var(--success)" />
      </div>

      {/* User Table */}
      <div className="panel pad">
        <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600 }}>
          Todos os Utilizadores
        </h3>
        <div className="table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plano</th>
                <th style={{ textAlign: "right" }}>Level</th>
                <th style={{ textAlign: "right" }}>Sessions</th>
                <th style={{ textAlign: "right" }}>Dúvidas IA</th>
                <th style={{ textAlign: "right" }}>🧠 Lifetime</th>
                <th style={{ textAlign: "right" }}>Custo IA €</th>
                <th style={{ textAlign: "right" }}>Revenue Líq. €</th>
                <th style={{ textAlign: "right" }}>Margem Pré-Imp. €</th>
                <th style={{ textAlign: "right" }}>Margem Pós-Imp. €</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId}>
                  <td>
                    <div>
                      <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{u.name}</span>
                      <br />
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-soft)", fontFamily: "monospace" }}>
                        {u.userId.substring(0, 8)}…
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.plan === "premium" ? "success" : "neutral"}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.level}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.sessions}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.doubts}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.lifetimeTokens}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--warning)" }}>{eur(u.aiCostEur)}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--success)" }}>
                    <div style={{ display: "grid", gap: 2, justifyItems: "end" }}>
                      <span>{eur(u.revenueEur)}</span>
                      {u.plan === "premium" ? (
                        <span style={{ fontSize: "0.72rem", color: "var(--muted-soft)" }}>
                          bruto {eur(u.grossRevenueEur)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color: u.marginEur >= 0 ? "var(--success)" : "var(--danger)",
                  }}>
                    {eur(u.marginEur)}
                  </td>
                  <td style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color: u.afterTaxMarginEur >= 0 ? "var(--success)" : "var(--danger)",
                  }}>
                    {eur(u.afterTaxMarginEur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="panel pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <span style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</span>
    </div>
  );
}
