import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { getRunDetail } from "@/lib/ops-data";
import { Database, Activity, Code } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRunDetail(id);

  if (!run) {
    notFound();
  }

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">{run.workflowName}</h1>
        <div className="meta-row" style={{ marginTop: 12 }}>
          <span>ID {run.id}</span>
          <span>Trigger <span style={{ fontFamily: "var(--font-mono)" }}>{run.trigger_type}</span></span>
          <StatusBadge kind={run.status}>{run.status}</StatusBadge>
          <StatusBadge kind={run.riskLevel === "high" || run.riskLevel === "critical" ? "danger" : (run.riskLevel === "low" ? "success" : "warning")}>
            Risco {run.riskLevel}
          </StatusBadge>
        </div>
        <p className="page-description" style={{ marginTop: 8 }}>
          {run.summary || "Sem resumo disponível."}
        </p>
      </header>

      <div className="panel-grid two">
        <section className="panel pad" style={{ borderTop: "4px solid var(--accent)" }}>
          <div className="section-head">
            <div className="flex-row">
              <div style={{ color: "var(--accent)" }}><Activity size={24} /></div>
              <div>
                <p className="eyebrow">Observabilidade</p>
                <h2>Passos Executados (Trace)</h2>
              </div>
            </div>
          </div>
          <div className="list-stack" style={{ marginTop: 24 }}>
            {run.steps.length === 0 ? (
              <div className="empty-state">Sem passos registados. O script abortou prematuramente ou não registou progresso explícito.</div>
            ) : (
              run.steps.map((step) => (
                <div className="data-block" key={step.id}>
                  <div className="data-block-header">
                    <div>
                      <h3 className="data-block-title" style={{ fontFamily: "var(--font-mono)" }}>{step.step_key}</h3>
                      <div className="data-block-meta" style={{ marginTop: 6 }}>
                        <span>Passo {step.step_order}</span>
                        <span>{formatDateTime(step.started_at)}</span>
                      </div>
                    </div>
                    <StatusBadge kind={step.status}>{step.status}</StatusBadge>
                  </div>
                  {step.error_log && (
                    <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", borderRadius: "var(--radius-sm)", marginTop: 12, border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.85rem" }}>
                      <strong>Erro detetado:</strong> {step.error_log}
                    </div>
                  )}
                  {step.output_payload && Object.keys(step.output_payload).length > 0 && (
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ fontSize: "0.85rem", cursor: "pointer", color: "var(--accent)" }}>Ver Output Payload</summary>
                      <pre className="code-block" style={{ marginTop: 8, fontSize: "0.75rem", overflowX: "auto" }}>
                        {JSON.stringify(step.output_payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <div className="stack-lg">
          <section className="panel pad" style={{ borderTop: "4px solid var(--info)" }}>
            <div className="section-head">
              <div className="flex-row">
                <div style={{ color: "var(--info)" }}><Code size={24} /></div>
                <div>
                  <p className="eyebrow">Script Base</p>
                  <h2>I/O Principal</h2>
                </div>
              </div>
            </div>
            <div className="list-stack" style={{ marginTop: 24 }}>
              <div className="stack-item">
                <strong>Input Payload</strong>
                <pre className="code-block" style={{ marginTop: 8, fontSize: "0.75rem", overflowX: "auto" }}>
                  {JSON.stringify(run.input_payload ?? {}, null, 2)}
                </pre>
              </div>
              <div className="stack-item">
                <strong>Final Output Payload</strong>
                <pre className="code-block" style={{ marginTop: 8, fontSize: "0.75rem", overflowX: "auto" }}>
                  {JSON.stringify(run.output_payload ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </section>

          <section className="panel pad" style={{ borderTop: "4px solid var(--warning)" }}>
            <div className="section-head">
              <div className="flex-row">
                <div style={{ color: "var(--warning)" }}><Database size={24} /></div>
                <div>
                  <p className="eyebrow">Dependências e Resultados</p>
                  <h2>Artefactos Gerados</h2>
                </div>
              </div>
            </div>
            <div className="list-stack" style={{ marginTop: 24 }}>
              <div className="stack-item">
                <strong>Snapshots Descarregados</strong>
                <div className="list-stack compact" style={{ marginTop: 8 }}>
                  {run.snapshots.length === 0 ? (
                    <div className="description" style={{ fontSize: "0.85rem" }}>Sem snapshots associados.</div>
                  ) : (
                    run.snapshots.map((snapshot) => (
                      <div key={snapshot.id} style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 8, borderBottom: "1px dashed var(--border)" }}>
                        <a href={snapshot.url} target="_blank" rel="noreferrer" className="link-inline" style={{ fontSize: "0.9rem" }}>
                          {snapshot.title || snapshot.source_name || snapshot.url}
                        </a>
                        <span style={{ fontSize: "0.80rem", color: "var(--muted)" }}>{snapshot.source_type} • {formatDateTime(snapshot.fetched_at)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="stack-item">
                <strong>Sinais Emitidos (Findings)</strong>
                <div className="list-stack compact" style={{ marginTop: 8 }}>
                  {run.findings.length === 0 ? (
                    <div className="description" style={{ fontSize: "0.85rem" }}>Esta run não gerou nenhum sinal/alerta.</div>
                  ) : (
                    run.findings.map((finding) => (
                      <div key={finding.id} style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 12, borderBottom: "1px dashed var(--border)" }}>
                        <div className="flex-row" style={{ justifyContent: "space-between" }}>
                          <strong style={{ fontSize: "0.9rem" }}>{finding.title}</strong>
                          <StatusBadge kind={finding.severity === "high" || finding.severity === "critical" ? "danger" : "warning"}>{finding.severity}</StatusBadge>
                        </div>
                        <p className="description" style={{ fontSize: "0.85rem", margin: 0 }}>{finding.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
