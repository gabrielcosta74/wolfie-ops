"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveResource } from "../actions";
import { Youtube } from "lucide-react";

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

export type VideoResource = {
  id: number;
  subtema_id: number;
  title: string;
  video_url: string | null;
  video_start_at: number | null;
  author_credit: string | null;
  is_premium: boolean;
};

type Props = {
  themes: Theme[];
  subtopics: Subtopic[];
  resource?: VideoResource;
};

function extractYoutubeId(url: string): string | null {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function VideoForm({ themes, subtopics, resource }: Props) {
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
  const [videoUrl, setVideoUrl] = useState(resource?.video_url ?? "");
  const [videoStartAt, setVideoStartAt] = useState<string>(
    resource?.video_start_at ? String(resource.video_start_at) : ""
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

  const youtubeId = videoUrl ? extractYoutubeId(videoUrl) : null;

  function handleSave() {
    if (!title.trim()) {
      setFeedback({ type: "error", message: "O título é obrigatório." });
      return;
    }
    if (!subtemaId) {
      setFeedback({ type: "error", message: "Seleciona o tema e subtópico." });
      return;
    }
    if (!videoUrl.trim()) {
      setFeedback({ type: "error", message: "A URL do vídeo é obrigatória." });
      return;
    }

    setFeedback(null);

    const formData = new FormData();
    if (resource?.id) formData.set("id", String(resource.id));
    formData.set("type", "video");
    formData.set("subtema_id", subtemaId);
    formData.set("title", title);
    formData.set("video_url", videoUrl);
    formData.set("video_start_at", videoStartAt || "0");
    formData.set("author_credit", authorCredit);
    if (isPremium) formData.set("is_premium", "on");

    startTransition(async () => {
      const result = await saveResource(formData);
      if (result.success) {
        if (!resource) {
          router.push("/manager/content/academy/videos");
        } else {
          setFeedback({ type: "success", message: "Vídeo guardado com sucesso!" });
        }
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao guardar." });
      }
    });
  }

  return (
    <div className="ac-main">
      <div className="ac-breadcrumb">
        <Link href="/manager/content/academy/videos">Vídeos</Link>
        <span className="ac-breadcrumb-sep">/</span>
        <span className="ac-breadcrumb-current">
          {resource ? "Editar Vídeo" : "Adicionar Vídeo"}
        </span>
      </div>

      <div className="ac-page-header">
        <div>
          <h1 className="ac-page-title">{resource ? "Editar Vídeo" : "Adicionar Vídeo"}</h1>
          <p className="ac-page-subtitle">
            {resource ? "Atualiza os dados do vídeo" : "Adiciona um novo vídeo ao portal"}
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
              placeholder="Título do vídeo…"
            />
          </div>

          <div className="ac-field">
            <label className="ac-label">URL do Vídeo (YouTube)</label>
            <input
              className="ac-input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <span className="ac-hint">
              Cola o link do YouTube. Formatos suportados: youtube.com/watch?v=... ou youtu.be/...
            </span>
            {youtubeId && (
              <div className="ac-video-preview">
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                  alt="Miniatura do vídeo"
                />
              </div>
            )}
          </div>

          <div className="ac-field-row">
            <div className="ac-field">
              <label className="ac-label">Autor / Fonte</label>
              <input
                className="ac-input"
                value={authorCredit}
                onChange={(e) => setAuthorCredit(e.target.value)}
                placeholder="Nome do professor, canal…"
              />
            </div>
            <div className="ac-field">
              <label className="ac-label">Iniciar em (segundos)</label>
              <input
                className="ac-input"
                type="number"
                min="0"
                value={videoStartAt}
                onChange={(e) => setVideoStartAt(e.target.value)}
                placeholder="0"
              />
              <span className="ac-hint">Deixa em branco ou 0 para começar do início.</span>
            </div>
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
            <Link href="/manager/content/academy/videos" className="ac-btn ac-btn--secondary">
              Cancelar
            </Link>
            <button
              type="button"
              className="ac-btn ac-btn--primary"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? <span className="ac-spinner" /> : <Youtube size={16} />}
              {isPending ? "A guardar..." : "Guardar vídeo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
