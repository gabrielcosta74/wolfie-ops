import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatRelativeWindow } from "@/lib/format";
import { listCurriculumFindings, listQualityReviews } from "@/lib/ops-data";
import { GraduationCap, PenTool } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContentHealthPage() {
  const [curriculumFindings, qualityReviews] = await Promise.all([
    listCurriculumFindings(),
    listQualityReviews(),
  ]);

  return (
    <div className="dashboard-stack">
      <header className="page-header">
        <h1 className="page-title">Mapa Editorial</h1>
        <p className="page-description">
          Onde devemos gastar tempo este mês? Este painel segrega exercícios abaixo da norma que requerem revisão urgente e lacunas no programa que exigem criação de conteúdo novo.
        </p>
      </header>

      <div className="panel-grid two">
        {/* BLOCO 1: Revisões Urgentes */}
        <section className="panel pad" style={{ borderTop: "4px solid var(--danger)" }}>
          <div className="section-head">
            <div className="flex-row">
              <div style={{ color: "var(--danger)" }}><PenTool size={24} /></div>
              <div>
                <p className="eyebrow">Auditoria de Qualidade</p>
                <h2>Exercícios Abaixo da Norma</h2>
              </div>
            </div>
          </div>
          <p className="description" style={{ marginBottom: 16 }}>
            Revisões urgentes recomendadas pelo auditor baseadas no score final, telemetria e issues concretas detetadas.
          </p>

          <div className="list-stack">
            {qualityReviews.length === 0 ? (
              <div className="empty-state">Sem revisões urgentes no momento.</div>
            ) : (
              qualityReviews.map((review) => (
                <div className="data-block" key={review.id}>
                  <div className="data-block-header">
                    <div>
                      <h3 className="data-block-title">
                        {typeof review.metadata?.title === "string" ? review.metadata.title : (review.exercise_id || "Exercício Desconhecido")}
                      </h3>
                      <div className="data-block-meta" style={{ marginTop: 6 }}>
                        <span>{review.exercise_source || "Fonte N/A"}</span>
                      </div>
                    </div>
                    <div className="flex-row">
                      <StatusBadge kind="danger">
                        Score: {review.final_score !== null ? review.final_score.toFixed(2) : "N/A"}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="detail-block" style={{ marginTop: 12, padding: "12px 16px", background: "var(--surface)" }}>
                    <div className="meta-row">
                      <span><strong>Problema:</strong> {review.operationalSummary.problem}</span>
                      <span><strong>Impacto:</strong> {review.operationalSummary.impact}</span>
                    </div>
                    <p className="description" style={{ marginTop: 8, marginBottom: 0 }}>
                      Próximo passo recomendado: {review.operationalSummary.action}. Recommendation atual: {review.recommendation || "Nenhuma"}.
                    </p>
                  </div>
                  <div style={{ marginTop: 12, fontSize: "0.80rem", color: "var(--muted)" }}>
                    Auditado {formatRelativeWindow(review.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* BLOCO 2: Lacunas Curriculares */}
        <section className="panel pad" style={{ borderTop: "4px solid var(--warning)" }}>
          <div className="section-head">
            <div className="flex-row">
              <div style={{ color: "var(--warning)" }}><GraduationCap size={24} /></div>
              <div>
                <p className="eyebrow">Novo Conteúdo</p>
                <h2>Lacunas no Programa</h2>
              </div>
            </div>
          </div>
          <p className="description" style={{ marginBottom: 16 }}>
            Desvios ou buracos no currículo onde a nossa base de dados é insuficiente face às diretrizes da tutela. Ideal para produção de novo conteúdo.
          </p>

          <div className="list-stack">
            {curriculumFindings.length === 0 ? (
              <div className="empty-state">O currículo parece estar perfeitamente coberto.</div>
            ) : (
              curriculumFindings.map((finding) => (
                <div className="data-block" key={finding.id}>
                  <div className="data-block-header">
                    <div>
                      <h3 className="data-block-title">{finding.title}</h3>
                      <div className="data-block-meta" style={{ marginTop: 6 }}>
                        <span>{finding.affected_theme || "Tema Desconhecido"}</span>
                        <span>• {finding.affected_subtopic || "Sem Subtópico"}</span>
                      </div>
                    </div>
                    <StatusBadge kind={finding.severity === "high" || finding.severity === "critical" ? "danger" : (finding.severity === "low" ? "success" : "warning")}>
                      {finding.severity}
                    </StatusBadge>
                  </div>
                  <p className="description" style={{ marginTop: 12 }}>
                    {finding.description}
                  </p>
                  <div className="detail-block" style={{ marginTop: 12, padding: "12px 16px", background: "var(--surface)" }}>
                    <div className="meta-row">
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Próximo passo</span>
                      <StatusBadge kind={finding.status === "pending_proposal" ? "warning" : "neutral"}>
                        {finding.status}
                      </StatusBadge>
                    </div>
                    <p className="description" style={{ marginTop: 8, marginBottom: 0 }}>
                      {finding.nextStep}
                    </p>
                  </div>
                  <div style={{ marginTop: 12, fontSize: "0.80rem", color: "var(--muted)" }}>
                    Reportado a {formatDateTime(finding.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
