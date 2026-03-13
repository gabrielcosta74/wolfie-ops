import Link from "next/link";
import { requireTeacherUser } from "@/lib/studio-auth";
import { getTeacherReviewDashboard, getTeacherReviewSetup } from "@/lib/teacher-review";
import { ReviewLauncher } from "./ReviewLauncher";

export default async function TeacherReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireTeacherUser();
  const [{ themes, subthemes }, dashboard, params] = await Promise.all([
    getTeacherReviewSetup(),
    getTeacherReviewDashboard(user.id, user.email ?? null),
    searchParams,
  ]);

  return (
    <div className="st-stack-lg">
      <div className="st-page-header">
        <div>
          <span className="st-page-kicker">Revisão guiada</span>
          <h1 className="st-page-title">Rever perguntas por tema</h1>
          <p className="st-page-subtitle">
            Escolhe um tema, gera uma amostra curta e segue pergunta a pergunta sem perder tempo em listas longas.
          </p>
        </div>
        {dashboard.activeBatch && (
          <Link href={`/studio/teacher/revisao/${dashboard.activeBatch.batchId}`} className="st-btn st-btn--secondary">
            Retomar revisão ativa
          </Link>
        )}
      </div>

      {params.error && <div className="st-feedback error">{params.error}</div>}

      {dashboard.activeBatch && (
        <section className="st-feature-card">
          <div>
            <span className="st-card-kicker">Sessão em curso</span>
            <h2 className="st-section-title" style={{ marginBottom: 6 }}>
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
            <Link href={`/studio/teacher/revisao/${dashboard.activeBatch.batchId}`} className="st-btn st-btn--primary">
              Continuar
            </Link>
          </div>
        </section>
      )}

      <section className="st-form-card">
        <div className="st-stack-sm">
          <div>
            <span className="st-card-kicker">Nova sessão</span>
            <h2 className="st-section-title">Gerar uma amostra útil</h2>
          </div>
          <ReviewLauncher themes={themes} subthemes={subthemes} />
        </div>
      </section>

      <section className="st-grid-3">
        <article className="st-info-card">
          <h3>Fluxo rápido</h3>
          <p>Vês a resposta certa e a explicação logo à partida. Escolhes, deixas nota se precisares e passas à seguinte.</p>
        </article>
        <article className="st-info-card">
          <h3>Sem repetições inúteis</h3>
          <p>A amostra tenta evitar voltar a mostrar-te perguntas que já tinhas revisto recentemente.</p>
        </article>
        <article className="st-info-card">
          <h3>Progresso guardado</h3>
          <p>Se saíres a meio, a revisão fica ativa e podes continuar mais tarde no mesmo ponto lógico.</p>
        </article>
      </section>
    </div>
  );
}
