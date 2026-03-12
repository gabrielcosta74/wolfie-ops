"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveResource } from "../actions";
import { Paperclip, FileText, Presentation, FileType2, File } from "lucide-react";

export type Theme = {
  id: number;
  codigo: string;
  nome: string;
  ordem: number;
};

export type Subtopic = {
  id: number;
  tema_id: number;
  codigo: string;
  nome: string;
  ordem: number;
};

export type FileResource = {
  id: number;
  subtema_id: number;
  title: string;
  video_url: string | null;
  video_provider: string | null;
  author_credit: string | null;
  is_premium: boolean;
};

type FileType = "pdf" | "powerpoint" | "word" | "outro";

const FILE_TYPES: { value: FileType; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "word", label: "Word" },
  { value: "outro", label: "Outro" },
];

function FileTypeIcon({ type }: { type: FileType }) {
  if (type === "pdf") return <FileText size={18} />;
  if (type === "powerpoint") return <Presentation size={18} />;
  if (type === "word") return <FileType2 size={18} />;
  return <File size={18} />;
}

type Props = {
  themes: Theme[];
  subtopics: Subtopic[];
  resource?: FileResource;
};

export function FicheiroForm({ themes, subtopics, resource }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialSubtopic = resource
    ? subtopics.find((s) => s.id === resource.subtema_id)
    : null;

  const [temaId, setTemaId] = useState<string>(
    initialSubtopic ? String(initialSubtopic.tema_id) : ""
  );
  const [subtemaId, setSubtemaId] = useState<string>(
    resource ? String(resource.subtema_id) : ""
  );
  const [title, setTitle] = useState(resource?.title ?? "");
  const [fileUrl, setFileUrl] = useState(resource?.video_url ?? "");
  const [fileType, setFileType] = useState<FileType>(
    (resource?.video_provider as FileType) ?? "pdf"
  );
  const [authorCredit, setAuthorCredit] = useState(resource?.author_credit ?? "");
  const [isPremium, setIsPremium] = useState(resource?.is_premium ?? false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredSubtopics = temaId
    ? subtopics.filter((s) => String(s.tema_id) === temaId)
    : subtopics;

  function handleTemaChange(value: string) {
    setTemaId(value);
    setSubtemaId("");
  }

  function handleSave() {
    if (!title.trim()) {
      setFeedback({ type: "error", message: "O título é obrigatório." });
      return;
    }
    if (!subtemaId) {
      setFeedback({ type: "error", message: "Seleciona o tema e subtópico." });
      return;
    }
    if (!fileUrl.trim()) {
      setFeedback({ type: "error", message: "A URL do ficheiro é obrigatória." });
      return;
    }

    setFeedback(null);

    const formData = new FormData();
    if (resource?.id) formData.set("id", String(resource.id));
    formData.set("type", "file");
    formData.set("subtema_id", subtemaId);
    formData.set("title", title);
    formData.set("video_url", fileUrl);
    formData.set("video_provider", fileType);
    formData.set("author_credit", authorCredit);
    if (isPremium) formData.set("is_premium", "on");

    startTransition(async () => {
      const result = await saveResource(formData);
      if (result.success) {
        if (!resource) {
          router.push("/manager/content/academy/ficheiros");
        } else {
          setFeedback({ type: "success", message: "Ficheiro guardado com sucesso!" });
        }
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao guardar." });
      }
    });
  }

  return (
    <div className="ac-main">
      <div className="ac-breadcrumb">
        <Link href="/manager/content/academy/ficheiros">Ficheiros</Link>
        <span className="ac-breadcrumb-sep">/</span>
        <span className="ac-breadcrumb-current">
          {resource ? "Editar Ficheiro" : "Adicionar Ficheiro"}
        </span>
      </div>

      <div className="ac-page-header">
        <div>
          <h1 className="ac-page-title">{resource ? "Editar Ficheiro" : "Adicionar Ficheiro"}</h1>
          <p className="ac-page-subtitle">
            {resource
              ? "Atualiza os dados do ficheiro"
              : "Adiciona um ficheiro partilhável ao portal"}
          </p>
        </div>
      </div>

      <div className="ac-form-card" style={{ maxWidth: "720px" }}>
        <div className="ac-form">
          <div className="ac-field-row">
            <div className="ac-field">
              <label className="ac-label">Tema</label>
              <select
                className="ac-select"
                value={temaId}
                onChange={(e) => handleTemaChange(e.target.value)}
              >
                <option value="">Seleciona o tema…</option>
                {themes.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.codigo} — {t.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="ac-field">
              <label className="ac-label">Subtópico</label>
              <select
                className="ac-select"
                value={subtemaId}
                onChange={(e) => setSubtemaId(e.target.value)}
              >
                <option value="">Seleciona o subtópico…</option>
                {filteredSubtopics.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.codigo} — {s.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ac-field">
            <label className="ac-label">Título</label>
            <input
              className="ac-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do ficheiro…"
            />
          </div>

          <div className="ac-field">
            <label className="ac-label">Tipo de ficheiro</label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {FILE_TYPES.map((ft) => (
                <label
                  key={ft.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    border: `1px solid ${fileType === ft.value ? "var(--ac-accent)" : "var(--ac-border)"}`,
                    borderRadius: "var(--ac-r-sm)",
                    background: fileType === ft.value ? "var(--ac-accent-bg)" : "var(--ac-surface)",
                    color: fileType === ft.value ? "var(--ac-accent)" : "var(--ac-muted)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.1s",
                  }}
                >
                  <input
                    type="radio"
                    name="fileType"
                    value={ft.value}
                    checked={fileType === ft.value}
                    onChange={() => setFileType(ft.value)}
                    style={{ display: "none" }}
                  />
                  <FileTypeIcon type={ft.value} />
                  {ft.label}
                </label>
              ))}
            </div>
          </div>

          <div className="ac-field">
            <label className="ac-label">URL do Ficheiro</label>
            <input
              className="ac-input"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/…"
            />
            <span className="ac-hint">
              Cola o link de partilha do Google Drive, Teams, Dropbox ou outro serviço de partilha.
            </span>
            {fileUrl && (
              <div className="ac-url-card">
                <div className="ac-url-card-icon">
                  <FileTypeIcon type={fileType} />
                </div>
                <div>
                  <div className="ac-url-text">{fileUrl}</div>
                  <div className="ac-url-domain">
                    {(() => {
                      try {
                        return new URL(fileUrl).hostname;
                      } catch {
                        return "";
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ac-field">
            <label className="ac-label">Autor / Fonte</label>
            <input
              className="ac-input"
              value={authorCredit}
              onChange={(e) => setAuthorCredit(e.target.value)}
              placeholder="Nome do professor, fonte…"
            />
          </div>

          <div className="ac-field">
            <label className="ac-checkbox-row">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
              />
              Conteúdo Premium
            </label>
          </div>

          {feedback && (
            <div className={`ac-feedback ${feedback.type}`}>{feedback.message}</div>
          )}

          <div className="ac-form-actions">
            <Link href="/manager/content/academy/ficheiros" className="ac-btn ac-btn--secondary">
              Cancelar
            </Link>
            <button
              type="button"
              className="ac-btn ac-btn--primary"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? <span className="ac-spinner" /> : <Paperclip size={16} />}
              {isPending ? "A guardar..." : "Guardar ficheiro"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
