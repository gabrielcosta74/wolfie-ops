import { notFound } from "next/navigation";
import { ProposalReviewPanel } from "@/components/proposal-review-panel";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { getProposalDetail } from "@/lib/ops-data";
import { ShieldCheck, FileText, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

function formatScore(value: unknown) {
  return typeof value === "number" ? value.toFixed(2) : "n/a";
}

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await getProposalDetail(id);

  if (!proposal) {
    notFound();
  }

  const adminTitle =
    proposal.exerciseContext && proposal.proposal_type === "execution_plan"
      ? `Rever ${proposal.exerciseContext.sourceLabel}: ${proposal.exerciseContext.exerciseTitle || proposal.exerciseContext.exerciseId || "sem título"}`
      : proposal.title;

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">{adminTitle}</h1>
        <div className="meta-row" style={{ marginTop: 12 }}>
          <span>{proposal.proposal_type}</span>
          <span>Criada a {formatDateTime(proposal.created_at)}</span>
          <StatusBadge kind={proposal.status}>{proposal.status}</StatusBadge>
          <StatusBadge kind={proposal.risk_level === "high" || proposal.risk_level === "critical" ? "danger" : (proposal.risk_level === "low" ? "success" : "warning")}>
            Risco {proposal.risk_level}
          </StatusBadge>
        </div>
      </header>

      {/* BLOCO 1: Decisão Humana */}
      <section className="panel pad" style={{ borderTop: "4px solid var(--accent)" }}>
        <div className="section-head">
          <div className="flex-row">
            <div style={{ color: "var(--accent)" }}><ShieldCheck size={24} /></div>
            <div>
              <p className="eyebrow">A Tua Decisão</p>
              <h2>Validação & Resultados</h2>
            </div>
          </div>
        </div>
        
        <div className="panel-grid two" style={{ marginTop: 24 }}>
          <div className="list-stack">
            <div className="stack-item" style={{ background: "var(--surface)", padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--warning)" }}>Problema Original</strong>
              <p className="description" style={{ marginTop: 4 }}>{proposal.decisionModel.problem || "Desconhecido"}</p>
            </div>
            
            <div className="stack-item" style={{ background: "var(--surface)", padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--info)" }}>Impacto / Justificação</strong>
              <p className="description" style={{ marginTop: 4 }}>{proposal.decisionModel.impact || "Desconhecido"}</p>
            </div>

            <div className="stack-item" style={{ background: "var(--surface)", padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--accent)" }}>Recomendação do Sistema</strong>
              <p className="description" style={{ marginTop: 4 }}>{proposal.decisionModel.systemRecommendation || "Sem recomendacao adicional."}</p>
            </div>

            <div className="stack-item" style={{ background: "var(--surface)", padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--accent)" }}>Prioridade Operacional</strong>
              <div className="meta-row" style={{ marginTop: 8 }}>
                <StatusBadge kind={proposal.decisionModel.priority === "high" ? "danger" : proposal.decisionModel.priority === "medium" ? "warning" : "success"}>
                  {proposal.decisionModel.priority}
                </StatusBadge>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {proposal.proposal_type === "report"
                    ? "Serve para validar um sinal e fechar o registo auditavel."
                    : "Serve para decidir se este caso entra numa fila de revisao controlada."}
                </span>
              </div>
            </div>
            
            <div className="stack-item" style={{ background: "var(--surface)", padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--success)" }}>Se Aprovares</strong>
              <p className="description" style={{ marginTop: 4 }}>{proposal.decisionModel.approveOutcome || "Execução do plano listado no bloco de contexto."}</p>
            </div>
            
            <div className="stack-item" style={{ background: "var(--surface)", padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--danger)" }}>Se Rejeitares</strong>
              <p className="description" style={{ marginTop: 4 }}>{proposal.decisionModel.rejectOutcome || "Nenhuma ação será executada."}</p>
            </div>
          </div>
          
          <div>
            <ProposalReviewPanel
              proposalId={proposal.id}
              currentStatus={proposal.status}
              proposalType={proposal.proposal_type}
            />
          </div>
        </div>
      </section>

      {/* BLOCO 2: Contexto Estruturado */}
      <section className="panel pad" style={{ borderTop: "4px solid var(--info)" }}>
        <div className="section-head">
          <div className="flex-row">
            <div style={{ color: "var(--info)" }}><FileText size={24} /></div>
            <div>
              <p className="eyebrow">Evidência</p>
              <h2>Dados para decidir</h2>
            </div>
          </div>
        </div>
        
        <div className="list-stack" style={{ marginTop: 24 }}>
          {proposal.exerciseContext ? (
            <>
              <div className="stack-item">
                <strong>Qual é o item em causa</strong>
                <div className="meta-row" style={{ marginTop: 8 }}>
                  <span>{proposal.exerciseContext.sourceLabel}</span>
                  <span>{proposal.exerciseContext.exerciseTitle || proposal.exerciseContext.exerciseId || "Sem titulo"}</span>
                  {proposal.exerciseContext.difficulty ? <span>Dificuldade atual: {proposal.exerciseContext.difficulty}</span> : null}
                </div>
              </div>

              <div className="detail-block" style={{ padding: "16px 18px", background: "var(--surface)" }}>
                <div className="meta-row">
                  <span><strong>Score:</strong> {formatScore(proposal.exerciseContext.finalScore)}</span>
                  <span><strong>Recommendation:</strong> {proposal.exerciseContext.recommendation || "n/a"}</span>
                  {proposal.exerciseContext.telemetryScore != null ? (
                    <span><strong>Telemetria:</strong> {proposal.exerciseContext.telemetryScore.toFixed(2)}</span>
                  ) : null}
                </div>
                {proposal.exerciseContext.issues.length > 0 ? (
                  <p className="description" style={{ marginTop: 10, marginBottom: 0 }}>
                    <strong>Issues detetadas:</strong> {proposal.exerciseContext.issues.join(" ")}
                  </p>
                ) : (
                  <p className="description" style={{ marginTop: 10, marginBottom: 0 }}>
                    O auditor nao encontrou erro claro; este caso existe sobretudo para decidir se vale a pena rever ou apenas continuar a observar.
                  </p>
                )}
              </div>

              <div className="stack-item">
                <strong>Excerto do enunciado</strong>
                <p className="description" style={{ marginTop: 6 }}>
                  {proposal.exerciseContext.statementPreview || "Sem excerto do enunciado disponivel."}
                </p>
              </div>
            </>
          ) : (
            <div className="stack-item">
              <strong>Resumo do caso</strong>
              <p className="description" style={{ marginTop: 6 }}>
                {proposal.rationale || proposal.finding?.description || "Sem contexto adicional."}
              </p>
            </div>
          )}

          {proposal.markdown_draft ? (
            <details className="ops-disclosure">
              <summary>Ver plano auditavel completo</summary>
              <div style={{ marginTop: 12 }}>
                <pre className="code-block">{proposal.markdown_draft}</pre>
              </div>
            </details>
          ) : null}
        </div>
      </section>

      {/* BLOCO 3: Origem e Dependências */}
      <section className="panel pad" style={{ borderTop: "4px solid var(--warning)" }}>
        <div className="section-head">
          <div className="flex-row">
            <div style={{ color: "var(--warning)" }}><Activity size={24} /></div>
            <div>
              <p className="eyebrow">Diagnóstico</p>
              <h2>Origem (Finding)</h2>
            </div>
          </div>
        </div>
        
        <div className="panel-grid" style={{ marginTop: 24 }}>
          {proposal.finding ? (
            <div className="list-stack">
              <div className="stack-item">
                <strong>{proposal.finding.title}</strong>
                <div className="meta-row" style={{ marginTop: 6 }}>
                  <span>Gerado via {proposal.finding.workflowName}</span>
                  <span>Detetado em {formatDateTime(proposal.finding.created_at)}</span>
                </div>
                <p className="description" style={{ marginTop: 8 }}>{proposal.finding.description}</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">Sem finding reportado para justificar esta proposal.</div>
          )}
        </div>
      </section>

      {/* BLOCO 4: Payload Técnico Oculto */}
      <section className="panel pad">
        <details className="ops-disclosure">
          <summary>
            Ver Detalhes Técnicos (JSON)
          </summary>
          <div style={{ marginTop: 16 }}>
            <p className="description" style={{ marginBottom: 16 }}>
              Payload completo armazenado na base de dados (structured_payload). Usar apenas para debugging.
            </p>
            <pre className="code-block" style={{ background: "var(--bg-inset)", fontSize: "0.75rem", overflowX: "auto" }}>
              {JSON.stringify(proposal.structured_payload ?? {}, null, 2)}
            </pre>
            
            {proposal.metadata && Object.keys(proposal.metadata).length > 0 && (
              <>
                <p className="description" style={{ marginBottom: 16, marginTop: 24 }}>
                  Execution metadata (estado de policies e retry).
                </p>
                <pre className="code-block" style={{ background: "var(--bg-inset)", fontSize: "0.75rem", overflowX: "auto" }}>
                  {JSON.stringify((proposal.metadata as Record<string, unknown> | undefined)?.execution ?? {}, null, 2)}
                </pre>
              </>
            )}
          </div>
        </details>
      </section>

    </div>
  );
}
