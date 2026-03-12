import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { COST_PER_CALL_EUR } from "@/lib/pricing-constants";
import { BarChart3, ArrowLeft, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getTokenAnalyticsData() {
  const supabase = getSupabaseAdmin();

  // Token ledger: all entries
  const { data: ledger } = await supabase
    .from("user_token_ledger")
    .select("action_key, tokens_delta, created_at")
    .order("created_at", { ascending: true });

  // Aggregate by action
  const byAction = new Map<string, { count: number; tokens: number; refunds: number }>();
  for (const entry of (ledger || [])) {
    const key = entry.action_key.replace(/_refund$/, "");
    const existing = byAction.get(key) || { count: 0, tokens: 0, refunds: 0 };
    if (entry.action_key.includes("refund")) {
      existing.refunds += Math.abs(entry.tokens_delta || 0);
    } else {
      existing.count += 1;
      existing.tokens += Math.abs(entry.tokens_delta || 0);
    }
    byAction.set(key, existing);
  }

  const actionBreakdown = Array.from(byAction.entries()).map(([key, v]) => ({
    action_key: key,
    label: COST_PER_CALL_EUR[key]?.description || key,
    count: v.count,
    tokens_consumed: v.tokens,
    tokens_refunded: v.refunds,
    refund_rate: v.count > 0 ? (v.refunds / (v.tokens + v.refunds)) * 100 : 0,
  })).sort((a, b) => b.tokens_consumed - a.tokens_consumed);

  // Aggregate by day
  const byDay = new Map<string, { count: number; tokens: number }>();
  for (const entry of (ledger || [])) {
    if (entry.tokens_delta > 0) continue; // skip refunds
    const day = entry.created_at.substring(0, 10);
    const existing = byDay.get(day) || { count: 0, tokens: 0 };
    existing.count += 1;
    existing.tokens += Math.abs(entry.tokens_delta || 0);
    byDay.set(day, existing);
  }
  const dailyData = Array.from(byDay.entries())
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // Wallet utilization
  const { data: wallets } = await supabase
    .from("user_token_wallets")
    .select("plan_code, monthly_quota_tokens, monthly_used_tokens, lifetime_used_tokens");

  const totalQuota = (wallets || []).reduce((a, w) => a + (w.monthly_quota_tokens || 0), 0);
  const totalUsed = (wallets || []).reduce((a, w) => a + (w.monthly_used_tokens || 0), 0);
  const totalLifetime = (wallets || []).reduce((a, w) => a + (w.lifetime_used_tokens || 0), 0);
  const utilization = totalQuota > 0 ? Math.round((totalUsed / totalQuota) * 100) : 0;

  // Total tokens
  const totalTokensConsumed = actionBreakdown.reduce((a, b) => a + b.tokens_consumed, 0);
  const totalTokensRefunded = actionBreakdown.reduce((a, b) => a + b.tokens_refunded, 0);
  const overallRefundRate = (totalTokensConsumed + totalTokensRefunded) > 0
    ? (totalTokensRefunded / (totalTokensConsumed + totalTokensRefunded)) * 100
    : 0;

  return {
    actionBreakdown,
    dailyData,
    totalTokensConsumed,
    totalTokensRefunded,
    totalLifetime,
    utilization,
    totalQuota,
    totalUsed,
    overallRefundRate,
  };
}

export default async function TokenAnalyticsPage() {
  const d = await getTokenAnalyticsData();

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: 32 }}>
        <Link href="/manager/financials" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12 }}>
          <ArrowLeft size={14} /> Financeiro
        </Link>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          📊 Token Analytics
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--muted)" }}>
          Consumo detalhado de Braincells e utilização de quota.
        </p>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <KpiCard label="Total Consumidos" value={String(d.totalTokensConsumed)} sub="Braincells (lifetime)" icon={<Zap size={18} />} color="var(--accent)" />
        <KpiCard label="Refunded" value={String(d.totalTokensRefunded)} sub={`${d.overallRefundRate.toFixed(1)}% refund rate`} icon={<RefreshCw size={18} />} color="var(--warning)" />
        <KpiCard label="Quota Utilização" value={`${d.utilization}%`} sub={`${d.totalUsed} / ${d.totalQuota} este mês`} icon={<BarChart3 size={18} />} color="var(--info)" />
        <KpiCard label="Lifetime Total" value={String(d.totalLifetime)} sub="todos os users" icon={<Zap size={18} />} color="var(--success)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* By action */}
        <div className="panel pad">
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={18} style={{ color: "var(--accent)" }} />
            Breakdown por Feature
          </h3>
          <div className="table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th style={{ textAlign: "right" }}>Chamadas</th>
                  <th style={{ textAlign: "right" }}>🧠 Consumo</th>
                  <th style={{ textAlign: "right" }}>↩️ Refunds</th>
                  <th style={{ textAlign: "right" }}>Refund %</th>
                </tr>
              </thead>
              <tbody>
                {d.actionBreakdown.map(row => (
                  <tr key={row.action_key}>
                    <td style={{ fontWeight: 500 }}>{row.label}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.count}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.tokens_consumed}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: row.tokens_refunded > 0 ? "var(--warning)" : "var(--muted-soft)" }}>
                      {row.tokens_refunded}
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {row.refund_rate > 0 ? `${row.refund_rate.toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily chart */}
        <div className="panel pad">
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} style={{ color: "var(--info)" }} />
            Consumo Diário
          </h3>
          {d.dailyData.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px" }}>
              <p>Sem dados de consumo diário.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {d.dailyData.map(day => {
                const maxTokens = Math.max(...d.dailyData.map(x => x.tokens), 1);
                const pct = Math.round((day.tokens / maxTokens) * 100);
                return (
                  <div key={day.day}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.8rem" }}>
                      <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{day.day}</span>
                      <span style={{ color: "var(--muted)" }}>{day.count} calls · {day.tokens} 🧠</span>
                    </div>
                    <div style={{ height: 6, background: "var(--surface-raised)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="panel pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <span style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</span>
      <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{sub}</span>
    </div>
  );
}
