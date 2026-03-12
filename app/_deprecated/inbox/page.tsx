import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatRelativeWindow } from "@/lib/format";
import { getDashboardData, listProposals, getLatestReviewBrief } from "@/lib/ops-data";
import { AlertCircle, FileText, Activity, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const data = await getDashboardData();
  const allProposals = await listProposals({ statuses: ["pending_review", "needs_revision"] });
  const latestBrief = await getLatestReviewBrief();
  
  const pendingProposals = allProposals;
  const pendingCases = latestBrief?.cases.filter(c => c.decisionStatus === "pending") ?? [];
  const failedRuns = data.recentRuns.filter(r => r.status === "failed");
  const recentFindings = data.recentFindings;

  return (
    <div className="dashboard-stack">
      <header className="page-header" style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 className="page-title">Central de Triagem</h1>
        <p className="page-description" style={{ margin: "8px auto 0", maxWidth: 600 }}>
          O Mission Control precisa das tuas decisões para continuar. Começa pela Fila de Casos e depois passa para as Propostas mais complexas.
        </p>
      </header>

      <div className="triage-container" style={{ gap: 32 }}>
        
        {/* DECK 1: Casos (Batches) */}
        <div className="triage-card" style={{ padding: "40px", borderColor: pendingCases.length > 0 ? "var(--warning)" : "var(--line)" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
             <div style={{ width: 64, height: 64, borderRadius: "50%", background: pendingCases.length > 0 ? "var(--warning-soft)" : "var(--surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", color: pendingCases.length > 0 ? "var(--warning)" : "var(--muted)" }}>
               <Layers size={32} />
             </div>
             <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 8px", fontSize: "1.5rem" }}>Fila de Casos (Padrões)</h2>
                <p style={{ margin: 0, color: "var(--muted)" }}>Agrupamentos de perguntas onde a IA detetou anomalias. Resolve em massa com a interface Tinder-like.</p>
             </div>
             <div style={{ textAlign: "right", paddingLeft: 24, borderLeft: "1px solid var(--line)" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1, color: pendingCases.length > 0 ? "var(--warning)" : "var(--muted)" }}>{pendingCases.length}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Pendentes</div>
             </div>
          </div>
          <div style={{ marginTop: 32 }}>
            <Link className={`button ${pendingCases.length > 0 ? "" : "secondary"}`} style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "1.1rem" }} href="/batches">
               {pendingCases.length > 0 ? "Iniciar Triagem de Casos" : "Ver Fila Vazia"} &rarr;
            </Link>
          </div>
        </div>

        {/* DECK 2: Propostas Editoriais */}
        <div className="triage-card" style={{ padding: "40px", borderColor: pendingProposals.length > 0 ? "var(--accent)" : "var(--line)" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
             <div style={{ width: 64, height: 64, borderRadius: "50%", background: pendingProposals.length > 0 ? "rgba(180, 145, 104, 0.1)" : "var(--surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", color: pendingProposals.length > 0 ? "var(--accent)" : "var(--muted)" }}>
               <FileText size={32} />
             </div>
             <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 8px", fontSize: "1.5rem" }}>Propostas Singulares</h2>
                <p style={{ margin: 0, color: "var(--muted)" }}>Reformulações complexas de conteúdo geradas em detalhe pela IA que aguardam o teu aval final.</p>
             </div>
             <div style={{ textAlign: "right", paddingLeft: 24, borderLeft: "1px solid var(--line)" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1, color: pendingProposals.length > 0 ? "var(--accent)" : "var(--muted)" }}>{pendingProposals.length}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Para Rever</div>
             </div>
          </div>
          <div style={{ marginTop: 32 }}>
            <Link className={`button ${pendingProposals.length > 0 ? "" : "secondary"}`} style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "1.1rem" }} href="/proposals">
               {pendingProposals.length > 0 ? "Rever Propostas" : "Sem Propostas de Topo"} &rarr;
            </Link>
          </div>
        </div>

        <div className="panel-grid two" style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
           {/* DECK 3: Exceções de Sistema */}
           <div className="triage-card" style={{ padding: "24px", borderColor: failedRuns.length > 0 ? "var(--danger)" : "var(--line)", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                 <div style={{ color: failedRuns.length > 0 ? "var(--danger)" : "var(--muted)" }}><AlertCircle size={24} /></div>
                 <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Exceções de Workflow</h3>
              </div>
              <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "0.9rem", flex: 1 }}>
                {failedRuns.length > 0 ? `${failedRuns.length} automações falharam nas últimas 24h.` : "Nenhum pipeline ou run falhou recentemente. Sistema limpo."}
              </p>
              <Link className="button secondary" style={{ justifyContent: "center" }} href="/runs">
                Analisar Logs Técnicos
              </Link>
           </div>
           
           {/* DECK 4: Sinais Anómalos */}
           <div className="triage-card" style={{ padding: "24px", borderColor: recentFindings.length > 0 ? "var(--info)" : "var(--line)", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                 <div style={{ color: recentFindings.length > 0 ? "var(--info)" : "var(--muted)" }}><Activity size={24} /></div>
                 <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Sinais do Radar</h3>
              </div>
              <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "0.9rem", flex: 1 }}>
                {recentFindings.length > 0 ? `${recentFindings.length} anomalias estatísticas sobem o limiar de alarme.` : "Nenhuma descida drástica de performance na aplicação."}
              </p>
              <Link className="button secondary" style={{ justifyContent: "center" }} href="/signals">
                Investigar Alertas
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
}
