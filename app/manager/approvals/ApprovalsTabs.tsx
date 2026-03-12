"use client";

import { useState, useTransition } from "react";
import { approveSubmission, rejectSubmission, approveMCQ, rejectMCQ } from "./actions";

type Submission = {
  id: string;
  type: string;
  title: string;
  url: string | null;
  content: string | null;
  email: string | null;
  escola: string | null;
  status: string | null;
  created_at: string | null;
  subtema: any;
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
  subtema: any;
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

export function ApprovalsTabs({ submissions, mcqs, log }: { submissions: Submission[]; mcqs: MCQ[]; log: LogEntry[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("submissions");

  return (
    <>
      <div className="appr-tabs">
        <button className={`appr-tab${activeTab === "submissions" ? " active" : ""}`} onClick={() => setActiveTab("submissions")}>
          📥 Sugestões
          {submissions.length > 0 && <span className="appr-tab-badge">{submissions.length}</span>}
        </button>
        <button className={`appr-tab${activeTab === "mcqs" ? " active" : ""}`} onClick={() => setActiveTab("mcqs")}>
          ❓ MCQ Pendentes
          {mcqs.length > 0 && <span className="appr-tab-badge">{mcqs.length}</span>}
        </button>
        <button className={`appr-tab${activeTab === "log" ? " active" : ""}`} onClick={() => setActiveTab("log")}>
          📋 Log
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
        <div className="appr-empty-icon">✅</div>
        <p>Nenhuma sugestão pendente!</p>
      </div>
    );
  }

  return (
    <div className="appr-list">
      {items.map((s) => (
        <div key={s.id} className="appr-item">
          <div className="appr-item-info">
            <h3 className="appr-item-title">{s.title}</h3>
            <div className="appr-item-meta">
              <span className="badge info">{s.type}</span>
              {(s.subtema as unknown as { nome: string } | null)?.nome && <span>{(s.subtema as unknown as { nome: string }).nome}</span>}
              {s.email && <span>📧 {s.email}</span>}
              {s.escola && <span>🏫 {s.escola}</span>}
              {s.created_at && <span>{new Date(s.created_at).toLocaleDateString("pt-PT")}</span>}
            </div>
            {s.url && <div className="appr-item-content"><a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>{s.url}</a></div>}
            {s.content && <div className="appr-item-content">{s.content}</div>}
          </div>
          <div className="appr-actions">
            <button
              className="appr-btn appr-btn--approve"
              disabled={pending}
              onClick={() => startTransition(async () => { await approveSubmission(s.id); })}
            >
              ✓ Aprovar
            </button>
            <button
              className="appr-btn appr-btn--reject"
              disabled={pending}
              onClick={() => startTransition(async () => { await rejectSubmission(s.id); })}
            >
              ✕ Rejeitar
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
        <div className="appr-empty-icon">✅</div>
        <p>Nenhuma pergunta MCQ pendente!</p>
      </div>
    );
  }

  return (
    <div className="appr-list">
      {items.map((q) => (
        <div key={q.id} className="appr-item">
          <div className="appr-item-info">
            <h3 className="appr-item-title">{q.pergunta}</h3>
            <div className="appr-item-meta">
              {(q.subtema as unknown as { nome: string } | null)?.nome && <span>{(q.subtema as unknown as { nome: string }).nome}</span>}
              <span>{q.dificuldade}</span>
              {q.submitted_by_email && <span>📧 {q.submitted_by_email}</span>}
              {q.created_at && <span>{new Date(q.created_at).toLocaleDateString("pt-PT")}</span>}
            </div>
            <div className="appr-mcq-options">
              {["A", "B", "C", "D"].map((opt) => {
                const key = `opcao_${opt.toLowerCase()}` as keyof MCQ;
                const isCorrect = q.opcao_correta.trim() === opt;
                return (
                  <div key={opt} className={`appr-mcq-option${isCorrect ? " correct" : ""}`}>
                    <strong>{opt}:</strong> {q[key] as string}
                  </div>
                );
              })}
            </div>
            {q.explicacao && <div className="appr-item-content" style={{ marginTop: 8 }}>💡 {q.explicacao}</div>}
          </div>
          <div className="appr-actions">
            <button
              className="appr-btn appr-btn--approve"
              disabled={pending}
              onClick={() => startTransition(async () => { await approveMCQ(q.id); })}
            >
              ✓ Aprovar
            </button>
            <button
              className="appr-btn appr-btn--reject"
              disabled={pending}
              onClick={() => startTransition(async () => { await rejectMCQ(q.id); })}
            >
              ✕ Rejeitar
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
        <div className="appr-empty-icon">📋</div>
        <p>Nenhuma atividade recente.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      {items.map((entry) => (
        <div key={entry.id} className="appr-log-item">
          <span style={{ fontSize: "1.2rem" }}>
            {entry.type === "public_submission" && "📥"}
            {entry.type === "teacher_mcq" && "❓"}
            {entry.type === "teacher_content" && "📚"}
            {entry.type === "teacher_flag" && "🚩"}
          </span>
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
