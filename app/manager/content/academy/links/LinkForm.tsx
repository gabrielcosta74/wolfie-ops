"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveResource } from "../actions";
import { Link2, ExternalLink } from "lucide-react";

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

export type LinkResource = {
  id: number;
  subtema_id: number;
  title: string;
  video_url: string | null;
  markdown_content: string | null;
  author_credit: string | null;
  is_premium: boolean;
};

type Props = {
  themes: Theme[];
  subtopics: Subtopic[];
  resource?: LinkResource;
};

export function LinkForm({ themes, subtopics, resource }: Props) {
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
  const [linkUrl, setLinkUrl] = useState(resource?.video_url ?? "");
  const [description, setDescription] = useState(resource?.markdown_content ?? "");
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

  function getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
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
    if (!linkUrl.trim()) {
      setFeedback({ type: "error", message: "A URL é obrigatória." });
      return;
    }

    setFeedback(null);

    const formData = new FormData();
    if (resource?.id) formData.set("id", String(resource.id));
    formData.set("type", "link");
    formData.set("subtema_id", subtemaId);
    formData.set("title", title);
    formData.set("video_url", linkUrl);
    formData.set("markdown_content", description);
    formData.set("author_credit", authorCredit);
    if (isPremium) formData.set("is_premium", "on");

    startTransition(async () => {
      const result = await saveResource(formData);
      if (result.success) {
        if (!resource) {
          router.push("/manager/content/academy/links");
        } else {
          setFeedback({ type: "success", message: "Link guardado com sucesso!" });
        }
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao guardar." });
      }
    });
  }

  const domain = linkUrl ? getDomain(linkUrl) : "";

  return (
    <div className="ac-main">
      <div className="ac-breadcrumb">
        <Link href="/manager/content/academy/links">Links</Link>
        <span className="ac-breadcrumb-sep">/</span>
        <span className="ac-breadcrumb-current">
          {resource ? "Editar Link" : "Adicionar Link"}
        </span>
      </div>

      <div className="ac-page-header">
        <div>
          <h1 className="ac-page-title">{resource ? "Editar Link" : "Adicionar Link"}</h1>
          <p className="ac-page-subtitle">
            {resource
              ? "Atualiza os dados do link"
              : "Adiciona um link útil ao portal"}
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
              placeholder="Nome do recurso…"
            />
          </div>

          <div className="ac-field">
            <label className="ac-label">URL</label>
            <input
              className="ac-input"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
            />
            {linkUrl && domain && (
              <div className="ac-url-card">
                <div className="ac-url-card-icon">
                  <ExternalLink size={18} />
                </div>
                <div>
                  <div className="ac-url-text">{linkUrl}</div>
                  <div className="ac-url-domain">{domain}</div>
                </div>
              </div>
            )}
          </div>

          <div className="ac-field">
            <label className="ac-label">Descrição (opcional)</label>
            <textarea
              className="ac-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do que este link contém…"
              rows={3}
            />
          </div>

          <div className="ac-field">
            <label className="ac-label">Autor / Fonte</label>
            <input
              className="ac-input"
              value={authorCredit}
              onChange={(e) => setAuthorCredit(e.target.value)}
              placeholder="Nome do site, professor, organização…"
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
            <Link href="/manager/content/academy/links" className="ac-btn ac-btn--secondary">
              Cancelar
            </Link>
            <button
              type="button"
              className="ac-btn ac-btn--primary"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? <span className="ac-spinner" /> : <Link2 size={16} />}
              {isPending ? "A guardar..." : "Guardar link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
