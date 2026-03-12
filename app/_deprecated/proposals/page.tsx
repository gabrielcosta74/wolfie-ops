import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { listProposals } from "@/lib/ops-data";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const proposals = await listProposals({ statuses: ["pending_review", "needs_revision"] });

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Proposals</h1>
        <p className="page-description">
          A fila real de decisao. Aqui so aparecem casos ainda abertos para aprovacao, rejeicao ou pedido de revisao.
        </p>
      </header>

      <section className="panel pad" style={{ borderTop: "4px solid var(--accent)" }}>
        <div className="section-head">
          <div className="flex-row">
            <div style={{ color: "var(--accent)" }}><FileText size={24} /></div>
            <div>
              <p className="eyebrow">Fase de decisão</p>
              <h2>Propostas A aguardar decisão</h2>
            </div>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: 24 }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Assunto & Contexto</th>
                <th>Problema Principal</th>
                <th style={{ minWidth: 150 }}>Impacto & Ação Recomendada</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Criada</th>
              </tr>
            </thead>
            <tbody>
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <span className="empty-state-icon">📋</span>
                      <div>Fila vazia. O sistema ainda não gerou propostas para revisão.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                proposals.map((proposal) => {
                  const contextualProposal = proposal as typeof proposal & {
                    contextLabel?: string;
                    decisionHint?: string | null;
                    decisionModel?: any;
                  };

                  const title = proposal.proposal_type === "execution_plan" && contextualProposal.contextLabel
                          ? `Rever ${contextualProposal.contextLabel}`
                          : proposal.title;

                  const problem = contextualProposal.decisionModel?.problem || "Sem descrição.";
                  const impact = contextualProposal.decisionModel?.impact || "Desconhecido.";
                  const systemRec = contextualProposal.decisionModel?.systemRecommendation || "";

                  return (
                    <tr key={proposal.id}>
                      <td>
                        <Link className="link-inline" href={`/proposals/${proposal.id}`}>
                          <strong style={{ display: "block", marginBottom: 6 }}>
                            {contextualProposal.humanTitle || title}
                          </strong>
                        </Link>
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          {contextualProposal.contextLabel || proposal.finding_id || "n/a"}
                        </span>
                      </td>
                      <td>
                        <p className="description" style={{ margin: 0, fontSize: "0.85rem" }}>
                          {problem}
                        </p>
                      </td>
                      <td>
                        <div className="stack-sm">
                          <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block" }}>
                            {impact}
                          </span>
                          {systemRec && (
                            <span style={{ fontSize: "0.85rem", color: "var(--info)", display: "block", marginTop: 4 }}>
                              ↳ {systemRec}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge kind={proposal.risk_level === "high" || proposal.risk_level === "critical" ? "danger" : (proposal.risk_level === "low" ? "success" : "warning")}>
                          {proposal.risk_level}
                        </StatusBadge>
                      </td>
                      <td>
                        <StatusBadge kind={proposal.status}>{proposal.status}</StatusBadge>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        {formatDateTime(proposal.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
