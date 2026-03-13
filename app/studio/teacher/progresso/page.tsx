import Link from "next/link";
import { requireTeacherUser } from "@/lib/studio-auth";
import { getTeacherReviewDashboard } from "@/lib/teacher-review";

export default async function TeacherProgressPage() {
  const user = await requireTeacherUser();
  const dashboard = await getTeacherReviewDashboard(user.id, user.email ?? null);

  return (
    <div className="st-stack-lg">
      <div className="st-page-header">
        <div>
          <span className="st-page-kicker">Meu progresso</span>
          <h1 className="st-page-title">Trabalho feito no Wolfie</h1>
          <p className="st-page-subtitle">Acompanha o que já reveste, o que sinalizaste e as sugestões que já enviaste.</p>
        </div>
      </div>

      <section className="st-grid-4">
        <div className="st-stat-card">
          <span className="st-stat-value">{dashboard.totalReviewed}</span>
          <span className="st-stat-label">Perguntas revistas</span>
        </div>
        <div className="st-stat-card">
          <span className="st-stat-value">{dashboard.totalIssues}</span>
          <span className="st-stat-label">Com problema</span>
        </div>
        <div className="st-stat-card">
          <span className="st-stat-value">{dashboard.totalCriticalFlags}</span>
          <span className="st-stat-label">Flags graves</span>
        </div>
        <div className="st-stat-card">
          <span className="st-stat-value">{dashboard.totalSuggestions}</span>
          <span className="st-stat-label">Sugestões novas</span>
        </div>
      </section>

      {dashboard.activeBatch && (
        <section className="st-feature-card">
          <div>
            <span className="st-card-kicker">Em curso</span>
            <h2 className="st-section-title">
              {dashboard.activeBatch.themeName}
              {dashboard.activeBatch.subtemaName ? ` · ${dashboard.activeBatch.subtemaName}` : ""}
            </h2>
            <p className="st-page-subtitle">
              {dashboard.activeBatch.reviewedCount} de {dashboard.activeBatch.questionCount} perguntas já revistas.
            </p>
          </div>
          <Link href={`/studio/teacher/revisao/${dashboard.activeBatch.batchId}`} className="st-btn st-btn--primary">
            Continuar revisão
          </Link>
        </section>
      )}

      <section className="st-form-card">
        <div className="st-section-head">
          <div>
            <span className="st-card-kicker">Histórico recente</span>
            <h2 className="st-section-title">Sessões de revisão</h2>
          </div>
          <Link href="/studio/teacher/revisao" className="st-btn st-btn--secondary st-btn--sm">
            Nova revisão
          </Link>
        </div>

        {!dashboard.recentBatches.length ? (
          <div className="st-empty">
            <div className="st-empty-icon">+</div>
            <p>Ainda não tens sessões registadas.</p>
          </div>
        ) : (
          <div className="st-list">
            {dashboard.recentBatches.map((batch) => (
              <div key={batch.batchId} className="st-list-item">
                <div className="st-list-item-top">
                  <div>
                    <h3 className="st-list-item-title">
                      {batch.themeName}
                      {batch.subtemaName ? ` · ${batch.subtemaName}` : ""}
                    </h3>
                    <div className="st-list-item-meta">
                      <span className={`st-badge st-badge--${batch.status === "completed" ? "live" : batch.status === "active" ? "pending" : "neutral"}`}>
                        {batch.status === "completed" ? "concluída" : batch.status === "active" ? "ativa" : "abandonada"}
                      </span>
                      <span>
                        {batch.reviewedCount}/{batch.questionCount} revistas
                      </span>
                      <span>{new Date(batch.createdAt).toLocaleDateString("pt-PT")}</span>
                    </div>
                  </div>
                  <div className="st-inline-actions">
                    <Link href={`/studio/teacher/revisao/${batch.batchId}`} className="st-btn st-btn--secondary st-btn--sm">
                      Abrir
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
