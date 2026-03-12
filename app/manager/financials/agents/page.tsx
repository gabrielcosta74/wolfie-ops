import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { COST_PER_CALL_EUR } from "@/lib/pricing-constants";
import { Bot, ArrowLeft, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getAgentCostsData() {
  const supabase = getSupabaseAdmin();

  // Agent workflows
  const { data: workflows } = await supabase
    .from("agent_workflows")
    .select("id, code, name, category, schedule_kind, risk_level, is_active");

  // Agent runs with workflow reference
  const { data: runs } = await supabase
    .from("agent_runs")
    .select("id, workflow_id, status, started_at, finished_at, created_at")
    .order("created_at", { ascending: false });

  // Build workflow map
  const workflowMap = new Map((workflows || []).map(w => [w.id, w]));
  const agentCost = COST_PER_CALL_EUR.agent_run_generic?.cost || 0.03;

  // Aggregate by workflow
  const byWorkflow = new Map<string, {
    workflow: any;
    total: number;
    succeeded: number;
    failed: number;
    totalCost: number;
    lastRun: string | null;
  }>();

  for (const run of (runs || [])) {
    const workflow = workflowMap.get(run.workflow_id);
    if (!workflow) continue;
    const key = workflow.code;
    const existing = byWorkflow.get(key) || {
      workflow,
      total: 0,
      succeeded: 0,
      failed: 0,
      totalCost: 0,
      lastRun: null,
    };
    existing.total += 1;
    if (run.status === "succeeded") existing.succeeded += 1;
    if (run.status === "failed") existing.failed += 1;
    existing.totalCost += agentCost;
    if (!existing.lastRun || run.created_at > existing.lastRun) {
      existing.lastRun = run.created_at;
    }
    byWorkflow.set(key, existing);
  }

  const workflowStats = Array.from(byWorkflow.values()).sort((a, b) => b.total - a.total);
  const totalRuns = workflowStats.reduce((a, w) => a + w.total, 0);
  const totalCost = workflowStats.reduce((a, w) => a + w.totalCost, 0);
  const totalFailed = workflowStats.reduce((a, w) => a + w.failed, 0);
  const overallSuccessRate = totalRuns > 0 ? Math.round(((totalRuns - totalFailed) / totalRuns) * 100) : 0;

  return { workflowStats, totalRuns, totalCost, totalFailed, overallSuccessRate };
}

function eur(value: number): string {
  return value < 0.01 ? `€${value.toFixed(4)}` : `€${value.toFixed(2)}`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default async function AgentCostsPage() {
  const d = await getAgentCostsData();

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: 32 }}>
        <Link href="/manager/financials" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12 }}>
          <ArrowLeft size={14} /> Financeiro
        </Link>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          🤖 Agent Costs
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--muted)" }}>
          Custos estimados dos agent workflows internos (ops automation).
        </p>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <KpiCard label="Total Runs" value={String(d.totalRuns)} icon={<Bot size={18} />} color="var(--accent)" />
        <KpiCard label="Custo Estimado" value={eur(d.totalCost)} icon={<Bot size={18} />} color="var(--warning)" />
        <KpiCard label="Taxa de Sucesso" value={`${d.overallSuccessRate}%`} icon={<CheckCircle size={18} />} color="var(--success)" />
        <KpiCard label="Falhas" value={String(d.totalFailed)} icon={<XCircle size={18} />} color="var(--danger)" />
      </div>

      {/* Workflow Table */}
      <div className="panel pad">
        <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={18} style={{ color: "var(--accent)" }} />
          Workflows
        </h3>
        <div className="table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Categoria</th>
                <th>Schedule</th>
                <th style={{ textAlign: "right" }}>Runs</th>
                <th style={{ textAlign: "right" }}>✓ OK</th>
                <th style={{ textAlign: "right" }}>✗ Falha</th>
                <th style={{ textAlign: "right" }}>Success %</th>
                <th style={{ textAlign: "right" }}>Custo €</th>
                <th>Último Run</th>
              </tr>
            </thead>
            <tbody>
              {d.workflowStats.map(ws => {
                const successRate = ws.total > 0 ? Math.round((ws.succeeded / ws.total) * 100) : 0;
                return (
                  <tr key={ws.workflow.code}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{ws.workflow.name}</span>
                      <br />
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-soft)", fontFamily: "monospace" }}>{ws.workflow.code}</span>
                    </td>
                    <td>
                      <span className="badge neutral">{ws.workflow.category}</span>
                    </td>
                    <td>
                      <span className={`badge ${ws.workflow.schedule_kind === "manual" ? "neutral" : "info"}`}>
                        {ws.workflow.schedule_kind}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{ws.total}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--success)" }}>{ws.succeeded}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: ws.failed > 0 ? "var(--danger)" : "var(--muted-soft)" }}>
                      {ws.failed}
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ color: successRate >= 80 ? "var(--success)" : successRate >= 50 ? "var(--warning)" : "var(--danger)" }}>
                        {successRate}%
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{eur(ws.totalCost)}</td>
                    <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{timeAgo(ws.lastRun)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--line-strong)" }}>
                <td colSpan={3} style={{ fontWeight: 700 }}>Total</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{d.totalRuns}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{d.workflowStats.reduce((a, w) => a + w.succeeded, 0)}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{d.totalFailed}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{d.overallSuccessRate}%</td>
                <td style={{ textAlign: "right", fontWeight: 700, color: "var(--warning)" }}>{eur(d.totalCost)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Warning about untracked costs */}
      <div style={{ marginTop: 24, padding: "16px 20px", background: "var(--warning-soft)", borderRadius: "var(--radius)", border: "1px solid rgba(245, 158, 11, 0.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AlertTriangle size={20} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "0.95rem" }}>Custos Estimados</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
            Os custos dos agents são estimativas baseadas num custo médio de ~€0.03/run. O custo real varia com o tamanho do payload e número de steps.
            Para custos exatos, integrar tracking de tokens_used por agent run.
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: {
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
