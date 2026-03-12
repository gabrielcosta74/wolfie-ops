import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatDuration } from "@/lib/format";
import { listRuns } from "@/lib/ops-data";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await listRuns();

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Run History</h1>
        <p className="page-description">
          Vista técnica das execuções sistémicas dos workflows. Consulta tempos de resposta, falhas e output direto dos scripts.
        </p>
      </header>

      <section className="panel pad">
        <div className="section-head">
          <div className="flex-row">
            <div style={{ color: "var(--text)" }}><Activity size={24} /></div>
            <div>
              <p className="eyebrow">Observabilidade</p>
              <h2>Últimas Execuções</h2>
            </div>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: 24 }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Trigger</th>
                <th>Início</th>
                <th>Duração</th>
                <th>Resumo</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Ainda não existem runs registadas.</div>
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <Link className="link-inline" href={`/runs/${run.id}`}>
                        <strong style={{ display: "block", marginBottom: 4 }}>{run.workflowName}</strong>
                      </Link>
                    </td>
                    <td>
                      <StatusBadge kind={run.status}>{run.status}</StatusBadge>
                    </td>
                    <td>
                      <span className="badge neutral" style={{ fontFamily: "var(--font-mono)" }}>
                        {run.trigger_type}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {formatDateTime(run.started_at ?? run.created_at)}
                    </td>
                    <td style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
                      {formatDuration(run.started_at, run.finished_at)}
                    </td>
                    <td style={{ fontSize: "0.85rem", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {run.summary || "Sem resumo."}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
