import { listReviewBriefs } from "@/lib/ops-data";
import { formatDateTime } from "@/lib/format";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { requireManagerUser } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export default async function ReviewsHistoryPage() {
  await requireManagerUser();
  const briefs = await listReviewBriefs();
  const v1Briefs = briefs
    .map((brief) => {
      const v1Cases = brief.cases.filter((reviewCase) => reviewCase.category !== "editorial");
      const approvedCases = v1Cases.filter((reviewCase) => reviewCase.decisionStatus === "accepted").length;
      const deferredCases = v1Cases.filter((reviewCase) => reviewCase.decisionStatus === "deferred").length;
      const ignoredCases = v1Cases.filter((reviewCase) => reviewCase.decisionStatus === "ignored").length;

      return {
        ...brief,
        v1Cases,
        v1Stats: {
          total: v1Cases.length,
          approved: approvedCases,
          deferred: deferredCases,
          ignored: ignoredCases,
        },
      };
    })
    .filter((brief) => brief.v1Cases.length > 0);

  return (
    <div style={{ padding: 48, maxWidth: 1000, margin: "0 auto" }}>
      <header className="page-header" style={{ marginBottom: 48 }}>
        <div>
          <h1 className="page-title">Histórico de Revisões</h1>
          <p className="page-description" style={{ marginTop: 8 }}>
            Revisões semanais e mensais com casos curriculares e operacionais relevantes.
          </p>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {v1Briefs.map((brief) => (
          <div key={brief.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Revisão de {formatDateTime(brief.created_at)}</h2>
                <p style={{ fontSize: "0.95rem", color: "var(--muted)", marginTop: 8 }}>
                  {brief.v1Stats.total} casos. {brief.v1Stats.approved} aceites. {brief.v1Stats.deferred} adiados. {brief.v1Stats.ignored} descartados.
                </p>
              </div>
              <StatusBadge kind={brief.status === "completed" ? "success" : "neutral"}>
                {brief.status === "completed" ? "Concluída" : "Em Aberto"}
              </StatusBadge>
            </div>
          </div>
        ))}
        {v1Briefs.length === 0 && (
          <div className="empty-state">Sem histórico de revisões V1 gravado.</div>
        )}
      </div>
    </div>
  );
}
