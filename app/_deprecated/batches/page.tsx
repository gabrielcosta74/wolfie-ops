import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getLatestReviewBrief } from "@/lib/ops-data";
import { AlertCircle, Check, X, Clock } from "lucide-react";

export const metadata = { title: "Caixa de Entrada | Wolfi Ops" };
export const dynamic = "force-dynamic";

export default async function TriageQueuePage() {
  const latestBrief = await getLatestReviewBrief();
  const cases = latestBrief?.cases.filter(c => c.decisionStatus === "pending") ?? [];

  return (
    <div className="dashboard-stack">
      <header className="page-header" style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 className="page-title">Fila de Triagem</h1>
        <p className="page-description" style={{ margin: "8px auto 0" }}>
          Tens {cases.length} caso{cases.length === 1 ? "" : "s"} a aguardar a tua revisão. Decide rápido.
        </p>
      </header>

      {!latestBrief ? (
        <section className="triage-container">
          <div className="empty-state" style={{ width: "100%", padding: 64 }}>
            <AlertCircle size={48} style={{ color: "var(--muted-soft)", marginBottom: 16 }} />
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px" }}>Nenhuma revisão ativa</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>O sistema de triagem precisa de uma revisão ativa gerada.</p>
          </div>
        </section>
      ) : cases.length === 0 ? (
        <section className="triage-container">
          <div className="empty-state" style={{ width: "100%", padding: 64 }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: "50%", background: "var(--success-soft)", 
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, margin: "0 auto" 
            }}>
              <Check size={40} style={{ color: "var(--success)" }} />
            </div>
            <h3 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>Inbox Zero</h3>
            <p style={{ margin: 0, color: "var(--muted)", maxWidth: 400 }}>
              Todos os casos pendentes foram analisados. Podes rever as tuas decisões ativas no Brief.
            </p>
            <Link className="button secondary mt-4" href={`/briefs/${latestBrief.id}`}>
              Ver Revisão Completa
            </Link>
          </div>
        </section>
      ) : (
        <div className="triage-container">
          {cases.map((reviewCase) => (
            <div className="triage-card" key={reviewCase.id}>
              <div className="triage-header">
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                    {reviewCase.category === "curricular" ? "Desvio Curricular" : "Padrão Editorial"}
                  </span>
                  <h2 style={{ margin: 0, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>{reviewCase.title}</h2>
                </div>
                <StatusBadge kind={reviewCase.highPriorityCount > 0 ? "danger" : "warning"}>
                   Afetadas: {reviewCase.pendingCount}
                </StatusBadge>
              </div>

              <div className="triage-content-box">
                <h4>O Problema</h4>
                <p>{reviewCase.problem}</p>
              </div>

              <div className="triage-content-box triage-diff">
                <h4>A Solução Proposta</h4>
                <p>{reviewCase.changeSummary}</p>
              </div>

              <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    <strong style={{ color: "var(--text)" }}>Impacto:</strong> {reviewCase.impact}
                 </div>
                 <Link className="button" href={`/batches/${encodeURIComponent(reviewCase.id)}`}>
                   Analisar & Decidir &rarr;
                 </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
