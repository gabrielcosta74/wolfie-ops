import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { listReviewBriefs } from "@/lib/ops-data";

export const metadata = { title: "Relatórios | Wolfie Ops" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const briefs = await listReviewBriefs();
  const latestBrief = briefs[0] ?? null;
  const archivedBriefs = briefs.slice(1);

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Relatórios</h1>
        <p className="page-description">
          Arquivo das revisões semanais e mensais geradas pelo sistema para apoiar decisões humanas sobre melhorias de conteúdo e alinhamento curricular.
        </p>
      </header>

      {latestBrief ? (
        <section className="panel pad" style={{ borderTop: "4px solid var(--accent)", marginBottom: "32px" }}>
          <div className="section-head" style={{ marginBottom: "24px" }}>
            <div>
              <p className="eyebrow">
                {latestBrief.period_type === "weekly" ? "Revisão semanal" : latestBrief.period_type === "monthly" ? "Revisão mensal" : "Revisão manual"}
              </p>
              <h2 style={{ fontSize: "1.5rem" }}>{latestBrief.title}</h2>
            </div>
            <StatusBadge kind={latestBrief.status === "published" ? "success" : "neutral"}>
              {latestBrief.status}
            </StatusBadge>
          </div>

          <div
            style={{
              marginBottom: "24px",
              background: "var(--surface)",
              padding: "16px 20px",
              borderRadius: "8px",
              borderLeft: "4px solid var(--accent)",
            }}
          >
            <h3 style={{ fontSize: "1rem", marginBottom: "8px", color: "var(--fg)" }}>Resumo executivo</h3>
            <p style={{ margin: 0, fontSize: "1.05rem", lineHeight: 1.6, color: "var(--fg-muted)" }}>
              {latestBrief.summary}
            </p>
          </div>

          <div className="panel-grid two" style={{ gap: "24px" }}>
            <div>
              <h4 style={{ marginBottom: "16px", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--fg-muted)" }}>
                Estado da revisão
              </h4>
              <ul style={{ paddingLeft: "20px", color: "var(--fg-muted)", display: "flex", flexDirection: "column", gap: "12px" }}>
                <li>{latestBrief.stats.pending} sugestão(ões) por decidir.</li>
                <li>{latestBrief.stats.editorial} item(ns) editoriais.</li>
                <li>{latestBrief.stats.curricular} item(ns) curriculares.</li>
              </ul>
            </div>

            <div>
              <h4 style={{ marginBottom: "16px", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--fg-muted)" }}>
                Próximo passo
              </h4>
              <p className="description">
                Abre a revisão atual para decidir o que deve avançar para melhoria concreta do banco de perguntas ou alinhamento curricular.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Link className="button secondary" href={`/briefs/${latestBrief.id}`}>
              Abrir relatório
            </Link>
          </div>
        </section>
      ) : (
        <section className="panel pad">
          <div className="empty-state">Ainda não existem relatórios gerados.</div>
        </section>
      )}

      <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Arquivo</h3>

      <div className="stack-sm">
        {archivedBriefs.length === 0 ? (
          <div className="panel" style={{ padding: "16px 24px" }}>
            <span style={{ color: "var(--fg-muted)" }}>Ainda não há mais relatórios arquivados.</span>
          </div>
        ) : (
          archivedBriefs.map((brief) => (
            <div
              className="panel"
              key={brief.id}
              style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: "1.05rem" }}>{brief.title}</h4>
                <span style={{ fontSize: "0.9rem", color: "var(--fg-muted)" }}>
                  Criado a {formatDateTime(brief.created_at)}
                </span>
              </div>
              <Link className="button secondary" href={`/briefs/${brief.id}`}>
                Abrir
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
