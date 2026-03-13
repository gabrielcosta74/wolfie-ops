import Link from "next/link";
import { requireTeacherUser } from "@/lib/studio-auth";
import { getTeacherReviewDashboard } from "@/lib/teacher-review";

export default async function TeacherDashboard() {
  const user = await requireTeacherUser();
  const dashboard = await getTeacherReviewDashboard(user.id, user.email ?? null);

  return (
    <div className="st-stack-lg">
      <div className="st-page-header">
        <div>
          <span className="st-page-kicker">Portal do professor</span>
          <h1 className="st-page-title">Revisão rápida do banco de perguntas</h1>
          <p className="st-page-subtitle">
            Olá, {user.email}. O foco aqui é rever perguntas rapidamente e deixar feedback útil para melhorar o Wolfie.
          </p>
        </div>
        <Link href="/studio/teacher/revisao" className="st-btn st-btn--primary">
          Nova revisão
        </Link>
      </div>

      {dashboard.activeBatch ? (
        <section className="st-feature-card">
          <div>
            <span className="st-card-kicker">Continua onde ficaste</span>
            <h2 className="st-section-title">
              {dashboard.activeBatch.themeName}
              {dashboard.activeBatch.subtemaName ? ` · ${dashboard.activeBatch.subtemaName}` : ""}
            </h2>
            <p className="st-page-subtitle">
              {dashboard.activeBatch.reviewedCount} de {dashboard.activeBatch.questionCount} perguntas já revistas.
            </p>
          </div>

          <div className="st-session-inline">
            <div className="st-progress-track">
              <div
                className="st-progress-fill"
                style={{
                  width: `${Math.max(
                    8,
                    Math.round((dashboard.activeBatch.reviewedCount / dashboard.activeBatch.questionCount) * 100)
                  )}%`,
                }}
              />
            </div>
            <Link href={`/studio/teacher/revisao/${dashboard.activeBatch.batchId}`} className="st-btn st-btn--secondary">
              Retomar revisão
            </Link>
          </div>
        </section>
      ) : (
        <section className="st-feature-card">
          <div>
            <span className="st-card-kicker">Sem sessão ativa</span>
            <h2 className="st-section-title">Começar uma nova revisão</h2>
            <p className="st-page-subtitle">
              Escolhe um tema, gera uma amostra de 20 perguntas e avalia uma a uma sem navegar em listas enormes.
            </p>
          </div>
          <Link href="/studio/teacher/revisao" className="st-btn st-btn--primary">
            Escolher tema
          </Link>
        </section>
      )}

      <section className="st-grid-4">
        <Link href="/studio/teacher/progresso" className="st-stat-card">
          <span className="st-stat-value">{dashboard.totalReviewed}</span>
          <span className="st-stat-label">Perguntas revistas</span>
        </Link>
        <Link href="/studio/teacher/progresso" className="st-stat-card">
          <span className="st-stat-value">{dashboard.totalIssues}</span>
          <span className="st-stat-label">Com problema</span>
        </Link>
        <Link href="/studio/teacher/progresso" className="st-stat-card">
          <span className="st-stat-value">{dashboard.totalCriticalFlags}</span>
          <span className="st-stat-label">Flags graves</span>
        </Link>
        <Link href="/studio/teacher/sugestoes/nova" className="st-stat-card">
          <span className="st-stat-value">{dashboard.totalSuggestions}</span>
          <span className="st-stat-label">Sugestões enviadas</span>
        </Link>
      </section>

      <section className="st-grid-3">
        <article className="st-info-card">
          <h3>1 pergunta por ecrã</h3>
          <p>Vês logo o enunciado, as opções, a resposta certa e a explicação no mesmo sítio.</p>
        </article>
        <article className="st-info-card">
          <h3>Decisão rápida</h3>
          <p>Aprovas, marcas problema, levantas flag grave ou saltas. A nota é opcional e curta.</p>
        </article>
        <article className="st-info-card">
          <h3>Trabalho útil</h3>
          <p>As tuas revisões ficam registadas e depois consegues ver o teu progresso por tema e por sessão.</p>
        </article>
      </section>
    </div>
  );
}
