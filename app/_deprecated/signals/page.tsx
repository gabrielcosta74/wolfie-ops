import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatRelativeWindow } from "@/lib/format";
import { listFindings } from "@/lib/ops-data";
import { Activity } from "lucide-react";
import { SignalInlineTriage } from "@/components/signal-inline-triage";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const findings = await listFindings();

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Signals no Radar</h1>
        <p className="page-description">
          Sinais que o sistema encontrou e que ainda precisam de triar, converter em proposal ou apenas continuar a monitorizar.
        </p>
      </header>

      <section className="panel pad" style={{ borderTop: "4px solid var(--info)" }}>
        <div className="section-head">
          <div className="flex-row">
            <div style={{ color: "var(--info)" }}><Activity size={24} /></div>
            <div>
              <p className="eyebrow">Diagnóstico em tempo real</p>
              <h2>Eventos e Alertas do Sistema</h2>
            </div>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: 24 }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ minWidth: 250 }}>Registo do Sinal</th>
                <th>Origem</th>
                <th>Prioridade</th>
                <th>Triage Rápida</th>
                <th>Estado Anterior</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody>
              {findings.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <span className="empty-state-icon">📡</span>
                      <div>O radar está limpo. Sem sinais detetados recentemente.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                findings.map((finding) => (
                  <tr key={finding.id}>
                    <td>
                      <Link className="link-inline" href={`/signals/${finding.id}`}>
                        <strong style={{ display: "block", marginBottom: 6 }}>{finding.title}</strong>
                      </Link>
                      <p className="description" style={{ margin: 0, fontSize: "0.85rem", maxWidth: 400 }}>
                        {finding.description.substring(0, 100)}{finding.description.length > 100 ? "..." : ""}
                      </p>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{finding.workflowName}</span>
                    </td>
                    <td>
                      <StatusBadge kind={finding.severity === "high" || finding.severity === "critical" ? "danger" : (finding.severity === "low" ? "success" : "warning")}>
                        {finding.severity}
                      </StatusBadge>
                    </td>
                    <td style={{ minWidth: 220 }}>
                      <SignalInlineTriage findingId={finding.id} currentStatus={finding.status} />
                    </td>
                    <td>
                      <StatusBadge kind={finding.status === "new" ? "info" : "neutral"}>
                        {finding.status === "new" ? "Novo" : finding.status}
                      </StatusBadge>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {formatDateTime(finding.created_at)}
                      <div style={{ marginTop: 4, opacity: 0.7 }}>
                        {formatRelativeWindow(finding.created_at)}
                      </div>
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
