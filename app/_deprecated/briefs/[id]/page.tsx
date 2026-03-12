import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefItemDecisionPanel } from "@/components/brief-item-decision-panel";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { getReviewBriefDetail } from "@/lib/ops-data";

export const dynamic = "force-dynamic";

function categoryTone(category: string) {
  if (category === "editorial") return "warning";
  if (category === "curricular") return "info";
  return "neutral";
}

export default async function ReviewBriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brief = await getReviewBriefDetail(id);

  if (!brief) {
    notFound();
  }

  const totalItems = brief.items.length;
  const progressPercent = totalItems > 0 ? Math.round(((brief.stats.approved + brief.stats.deferred) / totalItems) * 100) : 0;

  return (
    <div className="dashboard-stack">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
           <h1 className="page-title" style={{ fontSize: "2rem", marginBottom: 8 }}>{brief.title}</h1>
           <p className="page-description" style={{ margin: 0, maxWidth: 600 }}>
             {brief.summary}
           </p>
           <div className="meta-row" style={{ marginTop: 16 }}>
             <span>{brief.period_type}</span>
             <span>Criado a {formatDateTime(brief.created_at)}</span>
             <StatusBadge kind={brief.status === "published" ? "success" : "neutral"}>
               {brief.status}
             </StatusBadge>
           </div>
        </div>
        
        {/* Simple Ring Progress Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--surface)", padding: "12px 20px", borderRadius: 100, border: "1px solid var(--line)" }}>
           <div style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="var(--line-strong)" strokeWidth="4" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray="100" strokeDashoffset={100 - progressPercent} transform="rotate(-90 20 20)" style={{ transition: "stroke-dashoffset 1s ease" }} />
              </svg>
           </div>
           <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, lineHeight: 1 }}>{progressPercent}%</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Progresso</div>
           </div>
        </div>
      </header>

      {/* Kanban / Funnel Overview */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20 }}>
             <div style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Caixa de Entrada</div>
             <div style={{ fontSize: "2rem", fontWeight: 700 }}>{brief.stats.pending}</div>
             <div style={{ fontSize: "0.85rem", color: "var(--text)", marginTop: 4 }}>Items por analisar</div>
          </div>
          <div style={{ background: "var(--warning-soft)", border: "1px solid var(--warning)", borderRadius: "var(--radius)", padding: 20 }}>
             <div style={{ fontSize: "0.8rem", color: "var(--warning)", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Em Preparação</div>
             <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--warning)" }}>{brief.stats.deferred}</div>
             <div style={{ fontSize: "0.85rem", color: "var(--warning)", marginTop: 4 }}>Items adiados / em dev</div>
          </div>
          <div style={{ background: "var(--success-soft)", border: "1px solid var(--success)", borderRadius: "var(--radius)", padding: 20 }}>
             <div style={{ fontSize: "0.8rem", color: "var(--success)", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Aprovados</div>
             <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--success)" }}>{brief.stats.approved}</div>
             <div style={{ fontSize: "0.85rem", color: "var(--success)", marginTop: 4 }}>Prontos a implementar</div>
          </div>
      </section>

      <section>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>Itens Pendentes</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {brief.items.length === 0 ? (
            <div className="empty-state">Este relatório não tem itens ativos.</div>
          ) : (
            brief.items.map((item) => (
              <div className="triage-card" key={item.id} style={{ padding: 24 }}>
                <div className="triage-header" style={{ marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                      {item.category} • prioridade {item.priority}
                    </span>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", letterSpacing: "-0.01em" }}>{item.title}</h3>
                  </div>
                  <StatusBadge kind={item.decision_status === "pending" ? "warning" : "success"}>
                     {item.humanStatus}
                  </StatusBadge>
                </div>

                <div className="panel-grid two" style={{ gap: 20 }}>
                   <div className="triage-content-box" style={{ margin: 0 }}>
                      <h4>O Problema</h4>
                      <p style={{ fontSize: "0.95rem" }}>{item.problem}</p>
                   </div>
                   <div className="triage-content-box triage-diff" style={{ margin: 0 }}>
                      <h4>A Nossa Sugestão</h4>
                      <p style={{ fontSize: "0.95rem" }}>{item.changeSummary}</p>
                   </div>
                </div>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 20 }}>
                   <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      <strong style={{ color: "var(--text)" }}>Resultado Esperado:</strong> {item.expectedOutcome}
                   </div>
                   
                   <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                     {item.proposal_id ? (
                       <Link className="button secondary" href={`/proposals/${item.proposal_id}`}>
                         Ver detalhe da proposta
                       </Link>
                     ) : null}
                     
                     <BriefItemDecisionPanel
                       itemId={item.id}
                       currentStatus={item.decision_status}
                       approveLabel={item.decisionCopy.approveLabel}
                       deferLabel={item.decisionCopy.deferLabel}
                       ignoreLabel={item.decisionCopy.ignoreLabel}
                       helperText=""
                     />
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
