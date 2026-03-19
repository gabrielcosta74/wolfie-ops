"use client";

import { useMemo, useState, useTransition } from "react";
import {
  approveSubmission,
  rejectSubmission,
  approveMCQ,
  rejectMCQ,
  acknowledgeReview,
  publishSubmission,
} from "./actions";

type Submission = {
  attachments: Array<{
    downloadUrl: string | null;
    mimeType: string;
    name: string;
    path: string;
    size: number;
  }>;
  content: string | null;
  created_at: string | null;
  email: string | null;
  escola: string | null;
  id: string;
  instagram_handle: string | null;
  source_name: string | null;
  status: string | null;
  subtema: unknown;
  subtema_id: number | null;
  suggestion: string | null;
  title: string;
  type: string;
  url: string | null;
};

type MCQ = {
  id: string;
  pergunta: string;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  opcao_correta: string;
  explicacao: string;
  dificuldade: string | null;
  status: string | null;
  source: string | null;
  submitted_by_email: string | null;
  created_at: string | null;
  subtema: unknown;
};

type LogEntry = {
  id: string;
  type: string | null;
  message: string | null;
  meta: Record<string, unknown> | null;
  seen: boolean | null;
  created_at: string | null;
};

type FlaggedReview = {
  id: string;
  seen: boolean | null;
  created_at: string | null;
  decision: "has_issue" | "critical_flag";
  note: string;
  teacherEmail: string | null;
  batchId: string | null;
  questionId: string | null;
  reviewedAt: string;
  question: Record<string, unknown> | null;
};

type BatchHistory = {
  id: string;
  created_at: string | null;
  batchId: string;
  teacherEmail: string | null;
  themeName: string;
  subtemaName: string | null;
  questionCount: number;
  currentIndex: number;
  status: string;
  completedAt: string | null;
};

type SubtemaOption = {
  id: number;
  label: string;
};

type LeaderboardEntry = {
  handle: string;
  approvedCount: number;
};

type Tab = "submissions" | "mcqs" | "log" | "revisoes";
type ResourceType = "summary" | "video" | "file" | "link";

function normalizeInstagramHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function inferResourceType(submission: Submission): ResourceType {
  if (submission.type === "video") return "video";
  if (submission.type === "resumo") return "summary";
  if (submission.attachments.length > 0) return "file";
  if (submission.url) return "link";
  return "summary";
}

function getDefaultAttachmentPath(submission: Submission) {
  return submission.attachments[0]?.path ?? "";
}

export function ApprovalsTabs({
  submissions,
  subtemas,
  leaderboard,
  mcqs,
  log,
  flaggedReviews,
  batchHistory,
  unseenFlagCount,
}: {
  log: LogEntry[];
  mcqs: MCQ[];
  submissions: Submission[];
  subtemas: SubtemaOption[];
  leaderboard: LeaderboardEntry[];
  flaggedReviews: FlaggedReview[];
  batchHistory: BatchHistory[];
  unseenFlagCount: number;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("submissions");

  return (
    <>
      <div className="appr-tabs">
        <button className={`appr-tab${activeTab === "submissions" ? " active" : ""}`} onClick={() => setActiveTab("submissions")}>
          Sugestões
          {submissions.length > 0 && <span className="appr-tab-badge">{submissions.length}</span>}
        </button>
        <button className={`appr-tab${activeTab === "mcqs" ? " active" : ""}`} onClick={() => setActiveTab("mcqs")}>
          MCQ pendentes
          {mcqs.length > 0 && <span className="appr-tab-badge">{mcqs.length}</span>}
        </button>
        <button className={`appr-tab${activeTab === "revisoes" ? " active" : ""}`} onClick={() => setActiveTab("revisoes")}>
          Revisões
          {unseenFlagCount > 0 && <span className="appr-tab-badge appr-tab-badge--critical">{unseenFlagCount}</span>}
        </button>
        <button className={`appr-tab${activeTab === "log" ? " active" : ""}`} onClick={() => setActiveTab("log")}>
          Log
        </button>
      </div>

      {activeTab === "submissions" && <SubmissionsList items={submissions} subtemas={subtemas} leaderboard={leaderboard} />}
      {activeTab === "mcqs" && <MCQList items={mcqs} />}
      {activeTab === "revisoes" && <ReviewsList flagged={flaggedReviews} batches={batchHistory} />}
      {activeTab === "log" && <LogList items={log} />}
    </>
  );
}

function SubmissionsList({
  items,
  subtemas,
  leaderboard,
}: {
  items: Submission[];
  subtemas: SubtemaOption[];
  leaderboard: LeaderboardEntry[];
}) {
  if (!items.length) {
    return (
      <div className="appr-empty">
        <div className="appr-empty-icon">OK</div>
        <p>Nenhuma sugestão pendente.</p>
      </div>
    );
  }

  return (
    <div className="appr-submissions-layout">
      <aside className="appr-leaderboard">
        <div className="appr-leaderboard-head">
          <h3>Competição Instagram</h3>
          <p>Só contam recursos aprovados.</p>
        </div>
        {leaderboard.length === 0 ? (
          <div className="appr-empty appr-empty--compact">
            <p>Ainda não há aprovados com Instagram.</p>
          </div>
        ) : (
          <div className="appr-leaderboard-list">
            {leaderboard.map((entry, index) => (
              <div key={entry.handle} className="appr-leaderboard-item">
                <div className="appr-leaderboard-rank">#{index + 1}</div>
                <div className="appr-leaderboard-user">
                  <div className="appr-leaderboard-handle">@{entry.handle}</div>
                  <div className="appr-leaderboard-count">{entry.approvedCount} aprovados</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <div className="appr-list">
        {items.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} subtemas={subtemas} />
        ))}
      </div>
    </div>
  );
}

function SubmissionCard({
  submission,
  subtemas,
}: {
  submission: Submission;
  subtemas: SubtemaOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<ResourceType>(inferResourceType(submission));
  const [title, setTitle] = useState(submission.title);
  const [instagramHandle, setInstagramHandle] = useState(submission.instagram_handle ?? "");
  const [subtemaId, setSubtemaId] = useState(submission.subtema_id ? String(submission.subtema_id) : "");
  const [authorCredit, setAuthorCredit] = useState(submission.source_name ?? submission.instagram_handle ?? "");
  const [resourceUrl, setResourceUrl] = useState(submission.url ?? "");
  const [markdownContent, setMarkdownContent] = useState(submission.content ?? "");
  const [attachmentPath, setAttachmentPath] = useState(getDefaultAttachmentPath(submission));
  const [isPremium, setIsPremium] = useState(false);

  const helperText = useMemo(() => {
    if (resourceType === "summary") return "Publica já como resumo no catálogo.";
    if (resourceType === "video") return "Mantém só um vídeo final e o subtema certo.";
    if (resourceType === "file") return "Se houver anexo, podemos publicá-lo diretamente como ficheiro.";
    return "Usa link quando o recurso final é uma página externa.";
  }, [resourceType]);

  return (
    <div className="appr-item appr-item--submission">
      <div className="appr-item-info">
        <h3 className="appr-item-title">{submission.title}</h3>

        <div className="appr-item-meta">
          <span className="badge info">{submission.type}</span>
          {submission.suggestion && <span>{submission.suggestion}</span>}
          {(submission.subtema as { nome?: string } | null)?.nome && <span>{(submission.subtema as { nome: string }).nome}</span>}
          {submission.source_name && <span>{submission.source_name}</span>}
          {submission.instagram_handle && <span>@{submission.instagram_handle}</span>}
          {submission.email && <span>{submission.email}</span>}
          {submission.escola && <span>{submission.escola}</span>}
          {submission.created_at && <span>{new Date(submission.created_at).toLocaleDateString("pt-PT")}</span>}
        </div>

        {submission.url && (
          <div className="appr-item-content">
            <a href={submission.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
              {submission.url}
            </a>
          </div>
        )}

        {submission.content && <div className="appr-item-content">{submission.content}</div>}

        {submission.attachments.length > 0 && (
          <div className="appr-attachment-list">
            {submission.attachments.map((attachment) => (
              attachment.downloadUrl ? (
                <a
                  key={attachment.path}
                  className="appr-attachment"
                  href={attachment.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{attachment.name}</span>
                  <span>{Math.round(attachment.size / 1024)} KB</span>
                </a>
              ) : (
                <span key={attachment.path} className="appr-attachment">
                  <span>{attachment.name}</span>
                  <span>{Math.round(attachment.size / 1024)} KB</span>
                </span>
              )
            ))}
          </div>
        )}

        {expanded && (
          <form
            className="appr-editor"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              const formData = new FormData();
              formData.append("submission_id", submission.id);
              formData.append("resource_type", resourceType);
              formData.append("title", title);
              formData.append("instagram_handle", instagramHandle);
              formData.append("subtema_id", subtemaId);
              formData.append("author_credit", authorCredit);
              formData.append("resource_url", resourceUrl);
              formData.append("markdown_content", markdownContent);
              formData.append("attachment_path", attachmentPath);
              formData.append("is_premium", isPremium ? "true" : "false");

              startTransition(async () => {
                const result = await publishSubmission(formData);
                if (result?.error) {
                  setError(result.error);
                  return;
                }
                setExpanded(false);
              });
            }}
          >
            <div className="appr-editor-head">
              <div>
                <h4>Editor de aprovação</h4>
                <p>{helperText}</p>
              </div>
              <span className="badge neutral">Só conta na competição se for aprovado</span>
            </div>

            {error && <div className="ct-error">{error}</div>}

            <div className="appr-editor-grid">
              <label className="appr-field">
                <span>Instagram</span>
                <input
                  className="appr-input"
                  value={instagramHandle}
                  onChange={(event) => setInstagramHandle(normalizeInstagramHandle(event.target.value))}
                  placeholder="@wolfieuser"
                />
              </label>

              <label className="appr-field">
                <span>Subtópico</span>
                <select className="appr-input" value={subtemaId} onChange={(event) => setSubtemaId(event.target.value)}>
                  <option value="">Seleciona…</option>
                  {subtemas.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="appr-field appr-field--full">
                <span>Título final</span>
                <input className="appr-input" value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>

              <label className="appr-field">
                <span>Tipo final</span>
                <select className="appr-input" value={resourceType} onChange={(event) => setResourceType(event.target.value as ResourceType)}>
                  <option value="summary">Resumo</option>
                  <option value="video">Vídeo</option>
                  <option value="file">Ficheiro</option>
                  <option value="link">Link</option>
                </select>
              </label>

              <label className="appr-field">
                <span>Crédito</span>
                <input
                  className="appr-input"
                  value={authorCredit}
                  onChange={(event) => setAuthorCredit(event.target.value)}
                  placeholder="autor, canal ou @instagram"
                />
              </label>

              {(resourceType === "video" || resourceType === "link" || resourceType === "file") && (
                <label className="appr-field appr-field--full">
                  <span>{resourceType === "video" ? "URL do vídeo" : resourceType === "link" ? "URL final" : "URL final opcional"}</span>
                  <input
                    className="appr-input"
                    value={resourceUrl}
                    onChange={(event) => setResourceUrl(event.target.value)}
                    placeholder="https://..."
                  />
                </label>
              )}

              {resourceType === "file" && submission.attachments.length > 0 && (
                <label className="appr-field appr-field--full">
                  <span>Anexo a publicar</span>
                  <select className="appr-input" value={attachmentPath} onChange={(event) => setAttachmentPath(event.target.value)}>
                    {submission.attachments.map((attachment) => (
                      <option key={attachment.path} value={attachment.path}>
                        {attachment.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {(resourceType === "summary" || resourceType === "link" || resourceType === "file") && (
                <label className="appr-field appr-field--full">
                  <span>{resourceType === "summary" ? "Conteúdo do resumo" : "Nota/descrição editorial"}</span>
                  <textarea
                    className="appr-textarea"
                    rows={resourceType === "summary" ? 8 : 4}
                    value={markdownContent}
                    onChange={(event) => setMarkdownContent(event.target.value)}
                  />
                </label>
              )}

              <label className="appr-check">
                <input type="checkbox" checked={isPremium} onChange={(event) => setIsPremium(event.target.checked)} />
                <span>Marcar como premium</span>
              </label>
            </div>

            <div className="appr-editor-actions">
              <button type="submit" className="appr-btn appr-btn--approve" disabled={pending}>
                Aprovar e publicar
              </button>
              <button type="button" className="appr-btn appr-btn--view" disabled={pending} onClick={() => setExpanded(false)}>
                Fechar editor
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="appr-actions">
        <button
          className="appr-btn appr-btn--view"
          disabled={pending}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Fechar" : "Editar e publicar"}
        </button>
        <button
          className="appr-btn appr-btn--reject"
          disabled={pending}
          onClick={() => startTransition(async () => { await rejectSubmission(submission.id); })}
        >
          Rejeitar
        </button>
      </div>
    </div>
  );
}

function MCQList({ items }: { items: MCQ[] }) {
  const [pending, startTransition] = useTransition();

  if (!items.length) {
    return (
      <div className="appr-empty">
        <div className="appr-empty-icon">OK</div>
        <p>Nenhuma pergunta MCQ pendente.</p>
      </div>
    );
  }

  return (
    <div className="appr-list">
      {items.map((question) => (
        <div key={question.id} className="appr-item">
          <div className="appr-item-info">
            <h3 className="appr-item-title">{question.pergunta}</h3>
            <div className="appr-item-meta">
              {(question.subtema as { nome?: string } | null)?.nome && <span>{(question.subtema as { nome: string }).nome}</span>}
              {question.dificuldade && <span>{question.dificuldade}</span>}
              {question.submitted_by_email && <span>{question.submitted_by_email}</span>}
              {question.created_at && <span>{new Date(question.created_at).toLocaleDateString("pt-PT")}</span>}
            </div>
            <div className="appr-mcq-options">
              {["A", "B", "C", "D"].map((option) => {
                const key = `opcao_${option.toLowerCase()}` as keyof MCQ;
                const isCorrect = question.opcao_correta.trim() === option;
                return (
                  <div key={option} className={`appr-mcq-option${isCorrect ? " correct" : ""}`}>
                    <strong>{option}:</strong> {question[key] as string}
                  </div>
                );
              })}
            </div>
            {question.explicacao && <div className="appr-item-content" style={{ marginTop: 8 }}>{question.explicacao}</div>}
          </div>

          <div className="appr-actions">
            <button
              className="appr-btn appr-btn--approve"
              disabled={pending}
              onClick={() => startTransition(async () => { await approveMCQ(question.id); })}
            >
              Aprovar
            </button>
            <button
              className="appr-btn appr-btn--reject"
              disabled={pending}
              onClick={() => startTransition(async () => { await rejectMCQ(question.id); })}
            >
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewsList({ flagged, batches }: { flagged: FlaggedReview[]; batches: BatchHistory[] }) {
  const [pending, startTransition] = useTransition();

  const criticalCount = flagged.filter((r) => r.decision === "critical_flag").length;
  const hasIssueCount = flagged.filter((r) => r.decision === "has_issue").length;
  const unseenCount = flagged.filter((r) => !r.seen).length;

  return (
    <div className="appr-reviews">
      <div className="appr-review-stats">
        <div className="appr-review-stat">
          <div className="appr-review-stat-value">{batches.length}</div>
          <div className="appr-review-stat-label">Sessões de revisão</div>
        </div>
        <div className="appr-review-stat">
          <div className="appr-review-stat-value">{flagged.length}</div>
          <div className="appr-review-stat-label">Flags totais</div>
        </div>
        <div className="appr-review-stat appr-review-stat--warning">
          <div className="appr-review-stat-value">{hasIssueCount}</div>
          <div className="appr-review-stat-label">Com problema</div>
        </div>
        <div className="appr-review-stat appr-review-stat--danger">
          <div className="appr-review-stat-value">{criticalCount}</div>
          <div className="appr-review-stat-label">Críticos</div>
        </div>
        {unseenCount > 0 && (
          <div className="appr-review-stat appr-review-stat--unseen">
            <div className="appr-review-stat-value">{unseenCount}</div>
            <div className="appr-review-stat-label">Por ver</div>
          </div>
        )}
      </div>

      <div className="appr-review-section">
        <h3 className="appr-review-section-title">
          Precisam da tua atenção
          {flagged.length > 0 && <span className="appr-review-section-count">{flagged.length}</span>}
        </h3>

        {flagged.length === 0 ? (
          <div className="appr-empty">
            <div className="appr-empty-icon">✓</div>
            <p>Nenhuma questão flagged pelos professores.</p>
          </div>
        ) : (
          <div className="appr-list">
            {flagged.map((review) => {
              const q = review.question;
              const subtemaName = (q?.subtema as { nome?: string } | null)?.nome;
              return (
                <div key={review.id} className={`appr-item appr-review-item${!review.seen ? " unseen" : ""}`}>
                  <div className="appr-item-info">
                    <div className="appr-review-item-header">
                      <span className={`appr-decision-badge appr-decision-badge--${review.decision}`}>
                        {review.decision === "critical_flag" ? "🚨 Crítico" : "⚠️ Problema"}
                      </span>
                      {!review.seen && <span className="appr-unseen-dot" />}
                      <span className="appr-review-meta-text">
                        {review.teacherEmail ?? "professor"}
                        {" · "}
                        {review.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString("pt-PT") : "—"}
                      </span>
                    </div>

                    {q ? (
                      <>
                        <h3 className="appr-item-title" style={{ marginTop: 10 }}>
                          {q.pergunta as string}
                        </h3>
                        <div className="appr-item-meta">
                          {subtemaName && <span>{subtemaName}</span>}
                          {typeof q.dificuldade === "string" && q.dificuldade && <span>{q.dificuldade}</span>}
                          <span className="appr-question-id">ID: {review.questionId}</span>
                        </div>
                        <div className="appr-mcq-options" style={{ marginTop: 8 }}>
                          {["A", "B", "C", "D"].map((opt) => {
                            const key = `opcao_${opt.toLowerCase()}`;
                            const isCorrect = (q.opcao_correta as string)?.trim() === opt;
                            return (
                              <div key={opt} className={`appr-mcq-option${isCorrect ? " correct" : ""}`}>
                                <strong>{opt}:</strong> {q[key] as string}
                              </div>
                            );
                          })}
                        </div>
                        {q.explicacao && (
                          <div className="appr-item-content" style={{ marginTop: 8 }}>
                            {q.explicacao as string}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="appr-item-content">Questão ID: {review.questionId ?? "—"}</p>
                    )}

                    {review.note && (
                      <div className="appr-review-note">
                        <span className="appr-review-note-label">Nota do professor:</span>
                        {review.note}
                      </div>
                    )}
                  </div>

                  <div className="appr-actions">
                    {!review.seen && (
                      <button
                        className="appr-btn appr-btn--ack"
                        disabled={pending}
                        onClick={() => startTransition(async () => { await acknowledgeReview(review.id); })}
                      >
                        Reconhecer
                      </button>
                    )}
                    {review.questionId && (
                      <a
                        className="appr-btn appr-btn--view"
                        href={`/manager/questions/${review.questionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver questão
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="appr-review-section" style={{ marginTop: 32 }}>
        <h3 className="appr-review-section-title">
          Histórico de sessões
          {batches.length > 0 && <span className="appr-review-section-count">{batches.length}</span>}
        </h3>

        {batches.length === 0 ? (
          <div className="appr-empty">
            <div className="appr-empty-icon">—</div>
            <p>Nenhuma sessão de revisão registada.</p>
          </div>
        ) : (
          <div className="panel">
            {batches.map((batch) => {
              const progress = batch.questionCount > 0
                ? Math.round((batch.currentIndex / batch.questionCount) * 100)
                : 0;
              return (
                <div key={batch.id} className="appr-batch-item">
                  <div className="appr-batch-info">
                    <div className="appr-batch-theme">
                      {batch.themeName}
                      {batch.subtemaName && <span className="appr-batch-subtema"> · {batch.subtemaName}</span>}
                    </div>
                    <div className="appr-batch-meta">
                      <span>{batch.teacherEmail ?? "professor"}</span>
                      <span>{batch.questionCount} questões</span>
                      <span className={`appr-batch-status appr-batch-status--${batch.status}`}>
                        {batch.status === "completed" ? "Concluída" : batch.status === "active" ? "Em curso" : batch.status}
                      </span>
                      {batch.created_at && (
                        <span>{new Date(batch.created_at).toLocaleDateString("pt-PT")}</span>
                      )}
                    </div>
                  </div>
                  <div className="appr-batch-progress-wrap">
                    <div className="appr-batch-progress-bar">
                      <div className="appr-batch-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="appr-batch-progress-label">{batch.currentIndex}/{batch.questionCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LogList({ items }: { items: LogEntry[] }) {
  if (!items.length) {
    return (
      <div className="appr-empty">
        <div className="appr-empty-icon">LOG</div>
        <p>Nenhuma atividade recente.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      {items.map((entry) => (
        <div key={entry.id} className="appr-log-item">
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{entry.message}</div>
            {entry.created_at && (
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 2 }}>
                {new Date(entry.created_at).toLocaleString("pt-PT")}
              </div>
            )}
          </div>
          {!entry.seen && <span className="badge warning" style={{ fontSize: "0.65rem" }}>NOVO</span>}
        </div>
      ))}
    </div>
  );
}
