"use client";

import { useState, useTransition } from "react";
import { approveSubmission, rejectSubmission, approveMCQ, rejectMCQ } from "./actions";

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
  source_name: string | null;
  status: string | null;
  subtema: unknown;
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

type Tab = "submissions" | "mcqs" | "log";

export function ApprovalsTabs({ submissions, mcqs, log }: { log: LogEntry[]; mcqs: MCQ[]; submissions: Submission[] }) {
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
        <button className={`appr-tab${activeTab === "log" ? " active" : ""}`} onClick={() => setActiveTab("log")}>
          Log
        </button>
      </div>

      {activeTab === "submissions" && <SubmissionsList items={submissions} />}
      {activeTab === "mcqs" && <MCQList items={mcqs} />}
      {activeTab === "log" && <LogList items={log} />}
    </>
  );
}

function SubmissionsList({ items }: { items: Submission[] }) {
  const [pending, startTransition] = useTransition();

  if (!items.length) {
    return (
      <div className="appr-empty">
        <div className="appr-empty-icon">OK</div>
        <p>Nenhuma sugestão pendente.</p>
      </div>
    );
  }

  return (
    <div className="appr-list">
      {items.map((submission) => (
        <div key={submission.id} className="appr-item">
          <div className="appr-item-info">
            <h3 className="appr-item-title">{submission.title}</h3>

            <div className="appr-item-meta">
              <span className="badge info">{submission.type}</span>
              {submission.suggestion && <span>{submission.suggestion}</span>}
              {(submission.subtema as { nome?: string } | null)?.nome && <span>{(submission.subtema as { nome: string }).nome}</span>}
              {submission.source_name && <span>{submission.source_name}</span>}
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
          </div>

          <div className="appr-actions">
            <button
              className="appr-btn appr-btn--approve"
              disabled={pending}
              onClick={() => startTransition(async () => { await approveSubmission(submission.id); })}
            >
              Aprovar
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
      ))}
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
              <span>{question.dificuldade}</span>
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
