import Link from "next/link";
import { notFound } from "next/navigation";
import { MathText } from "@/components/math-text";
import { submitTeacherQuestionReview } from "../../actions";
import { requireTeacherUser } from "@/lib/studio-auth";
import { getTeacherReviewBatchSession } from "@/lib/teacher-review";

function formatDecisionLabel(decision: string) {
  switch (decision) {
    case "approved":
      return "Aprovadas";
    case "has_issue":
      return "Com problema";
    case "critical_flag":
      return "Flags graves";
    case "skipped":
      return "Saltadas";
    default:
      return decision;
  }
}

export default async function TeacherReviewBatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireTeacherUser();
  const [{ batchId }, query] = await Promise.all([params, searchParams]);
  const session = await getTeacherReviewBatchSession(user.id, batchId);

  if (!session) {
    notFound();
  }

  const progressValue = session.batch.questionCount
    ? Math.round((session.batch.reviewedCount / session.batch.questionCount) * 100)
    : 0;

  if (session.isCompleted || !session.currentQuestion) {
    return (
      <div className="st-stack-lg">
        <div className="st-page-header">
          <div>
            <span className="st-page-kicker">Sessão concluída</span>
            <h1 className="st-page-title">Revisão terminada</h1>
            <p className="st-page-subtitle">
              Reveste {session.batch.themeName}
              {session.batch.subtemaName ? ` · ${session.batch.subtemaName}` : ""} até ao fim.
            </p>
          </div>
          <Link href="/studio/teacher/revisao" className="st-btn st-btn--primary">
            Nova revisão
          </Link>
        </div>

        <section className="st-feature-card">
          <div className="st-stack-sm">
            <span className="st-card-kicker">Resumo</span>
            <h2 className="st-section-title">
              {session.batch.reviewedCount} / {session.batch.questionCount} perguntas revistas
            </h2>
          </div>
          <div className="st-grid-4">
            {Object.entries(session.batch.decisionCounts).map(([decision, value]) => (
              <div key={decision} className="st-stat-card">
                <span className="st-stat-value">{value}</span>
                <span className="st-stat-label">{formatDecisionLabel(decision)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const question = session.currentQuestion;
  const correctOption =
    question.opcaoCorreta === "A"
      ? question.opcaoA
      : question.opcaoCorreta === "B"
        ? question.opcaoB
        : question.opcaoCorreta === "C"
          ? question.opcaoC
          : question.opcaoD;

  return (
    <div className="st-review-screen">
      <div className="st-review-header">
        <div>
          <span className="st-page-kicker">Sessão de revisão</span>
          <h1 className="st-page-title">
            {session.batch.themeName}
            {session.batch.subtemaName ? ` · ${session.batch.subtemaName}` : ""}
          </h1>
          <p className="st-page-subtitle">
            Pergunta {session.batch.reviewedCount + 1} de {session.batch.questionCount}
          </p>
        </div>

        <div className="st-review-header-actions">
          <Link href="/studio/teacher/revisao" className="st-btn st-btn--secondary">
            Guardar e sair
          </Link>
        </div>
      </div>

      <div className="st-progress-track st-progress-track--lg">
        <div className="st-progress-fill" style={{ width: `${Math.max(6, progressValue)}%` }} />
      </div>

      {query.error && <div className="st-feedback error">{query.error}</div>}

      <div className="st-review-layout">
        <section className="st-review-question">
          <div className="st-review-card">
            <div className="st-review-card-top">
              <div>
                <span className="st-card-kicker">Enunciado</span>
                <h2 className="st-review-question-title">
                  <MathText text={question.pergunta} />
                </h2>
              </div>
              <div className="st-review-tags">
                {question.dificuldade && <span className="st-badge st-badge--neutral">{question.dificuldade}</span>}
                {question.subtemaName && <span className="st-badge st-badge--neutral">{question.subtemaName}</span>}
              </div>
            </div>

            <div className="st-answer-grid">
              {[
                { key: "A", value: question.opcaoA },
                { key: "B", value: question.opcaoB },
                { key: "C", value: question.opcaoC },
                { key: "D", value: question.opcaoD },
              ].map((option) => (
                <div
                  key={option.key}
                  className={`st-answer-card${question.opcaoCorreta === option.key ? " is-correct" : ""}`}
                >
                  <span className="st-answer-letter">{option.key}</span>
                  <span>
                    <MathText text={option.value} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="st-review-card">
            <span className="st-card-kicker">Avaliação</span>
            <form action={submitTeacherQuestionReview} className="st-form">
              <input type="hidden" name="batch_id" value={session.batch.batchId} />
              <input type="hidden" name="question_id" value={question.id} />

              <div className="st-field">
                <label className="st-label" htmlFor={`review-note-${question.id}`}>
                  Nota opcional
                </label>
                <textarea
                  id={`review-note-${question.id}`}
                  name="note"
                  className="st-textarea"
                  rows={4}
                  placeholder="Escreve uma nota curta se houver algo a corrigir, melhorar ou sinalizar."
                />
              </div>

              <div className="st-review-actions">
                <button type="submit" name="decision" value="approved" className="st-decision-btn st-decision-btn--approve">
                  Aprovar
                </button>
                <button type="submit" name="decision" value="has_issue" className="st-decision-btn st-decision-btn--issue">
                  Tem problema
                </button>
                <button type="submit" name="decision" value="critical_flag" className="st-decision-btn st-decision-btn--critical">
                  Flag grave
                </button>
                <button type="submit" name="decision" value="skipped" className="st-decision-btn st-decision-btn--skip">
                  Saltar
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="st-review-sidebar">
          <div className="st-review-card">
            <span className="st-card-kicker">Resposta certa</span>
            <div className="st-correct-answer">{question.opcaoCorreta}</div>
            <div className="st-page-subtitle" style={{ marginTop: 12 }}>
              <MathText text={correctOption} />
            </div>
          </div>

          <div className="st-review-card">
            <span className="st-card-kicker">Explicação</span>
            <div className="st-review-explanation">
              <MathText text={question.explicacao} />
            </div>
          </div>

          <div className="st-review-card">
            <span className="st-card-kicker">Progresso desta sessão</span>
            <div className="st-review-summary-list">
              {Object.entries(session.batch.decisionCounts).map(([decision, value]) => (
                <div key={decision} className="st-review-summary-item">
                  <span>{formatDecisionLabel(decision)}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
