"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/tiptap-editor";
import { saveResource } from "../actions";
import katex from "katex";
import "katex/dist/katex.min.css";

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

export type Resource = {
  id: number;
  subtema_id: number;
  title: string;
  markdown_content: string | null;
  author_credit: string | null;
  is_premium: boolean;
};

type Mode = "editor" | "split" | "preview";

type Props = {
  themes: Theme[];
  subtopics: Subtopic[];
  resource?: Resource;
};

export function ResumoEditor({ themes, subtopics, resource }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const previewRef = useRef<HTMLDivElement>(null);

  // Find the tema_id for the initial subtema if editing
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
  const [richContent, setRichContent] = useState(resource?.markdown_content ?? "");
  const [authorCredit, setAuthorCredit] = useState(resource?.author_credit ?? "");
  const [isPremium, setIsPremium] = useState(resource?.is_premium ?? false);
  const [mode, setMode] = useState<Mode>("split");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredSubtopics = temaId
    ? subtopics.filter((s) => String(s.tema_id) === temaId)
    : subtopics;

  // Reset subtema when tema changes
  function handleTemaChange(value: string) {
    setTemaId(value);
    setSubtemaId("");
  }

  // Render math in preview
  useEffect(() => {
    if (!previewRef.current) return;
    previewRef.current.querySelectorAll('[data-type="inline-math"]').forEach((el) => {
      const latex = el.getAttribute("data-latex") || "";
      try {
        el.innerHTML = katex.renderToString(latex, { throwOnError: false });
      } catch {}
    });
    previewRef.current.querySelectorAll('[data-type="block-math"]').forEach((el) => {
      const latex = el.getAttribute("data-latex") || "";
      try {
        el.innerHTML = katex.renderToString(latex, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {}
    });
  }, [richContent]);

  function handleSave() {
    if (!title.trim()) {
      setFeedback({ type: "error", message: "O título é obrigatório." });
      return;
    }
    if (!subtemaId) {
      setFeedback({ type: "error", message: "Seleciona o tema e subtópico." });
      return;
    }
    if (!richContent.trim() || richContent === "<p></p>") {
      setFeedback({ type: "error", message: "O conteúdo do resumo não pode estar vazio." });
      return;
    }

    setFeedback(null);

    const formData = new FormData();
    if (resource?.id) formData.set("id", String(resource.id));
    formData.set("type", "summary");
    formData.set("subtema_id", subtemaId);
    formData.set("title", title);
    formData.set("markdown_content", richContent);
    formData.set("author_credit", authorCredit);
    if (isPremium) formData.set("is_premium", "on");

    startTransition(async () => {
      const result = await saveResource(formData);
      if (result.success) {
        if (!resource) {
          router.push("/manager/content/academy/resumos");
        } else {
          setFeedback({ type: "success", message: "Resumo guardado com sucesso!" });
        }
      } else {
        setFeedback({ type: "error", message: result.error ?? "Erro ao guardar." });
      }
    });
  }

  const showEditor = mode === "editor" || mode === "split";
  const showPreview = mode === "preview" || mode === "split";

  return (
    <div className="ac-editor-shell">
      {/* Topbar */}
      <div className="ac-editor-topbar">
        <div className="ac-editor-topbar-left">
          <div className="ac-breadcrumb" style={{ margin: 0 }}>
            <Link href="/manager/content/academy/resumos" className="ac-breadcrumb-link">
              Resumos
            </Link>
            <span className="ac-breadcrumb-sep">/</span>
            <span className="ac-breadcrumb-current">
              {resource ? title || "Editar Resumo" : "Novo Resumo"}
            </span>
          </div>
        </div>

        <div className="ac-editor-topbar-center">
          <input
            className="ac-editor-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do resumo..."
          />
        </div>

        <div className="ac-editor-topbar-right">
          <div className="ac-mode-switcher">
            <button
              type="button"
              className={`ac-mode-btn${mode === "editor" ? " active" : ""}`}
              onClick={() => setMode("editor")}
            >
              Editor
            </button>
            <button
              type="button"
              className={`ac-mode-btn${mode === "split" ? " active" : ""}`}
              onClick={() => setMode("split")}
            >
              Dividido
            </button>
            <button
              type="button"
              className={`ac-mode-btn${mode === "preview" ? " active" : ""}`}
              onClick={() => setMode("preview")}
            >
              Preview
            </button>
          </div>

          <label className={`ac-premium-toggle${isPremium ? " is-premium" : ""}`}>
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
            />
            Premium
          </label>

          <button
            type="button"
            className="ac-btn ac-btn--primary ac-btn--sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? <span className="ac-spinner" /> : null}
            {isPending ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Meta bar */}
      <div className="ac-editor-meta-bar">
        <select
          className="ac-select"
          value={temaId}
          onChange={(e) => handleTemaChange(e.target.value)}
          style={{ maxWidth: "220px" }}
        >
          <option value="">Seleciona o tema…</option>
          {themes.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.codigo} — {t.nome}
            </option>
          ))}
        </select>

        <select
          className="ac-select"
          value={subtemaId}
          onChange={(e) => setSubtemaId(e.target.value)}
          style={{ maxWidth: "220px" }}
          disabled={!temaId && filteredSubtopics.length === subtopics.length}
        >
          <option value="">Seleciona o subtópico…</option>
          {filteredSubtopics.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.codigo} — {s.nome}
            </option>
          ))}
        </select>

        <input
          className="ac-input"
          value={authorCredit}
          onChange={(e) => setAuthorCredit(e.target.value)}
          placeholder="Autor / fonte (opcional)"
          style={{ maxWidth: "200px" }}
        />

        {feedback && (
          <div className={`ac-feedback ${feedback.type}`} style={{ marginLeft: "auto" }}>
            {feedback.message}
          </div>
        )}
      </div>

      {/* Panes */}
      <div className="ac-editor-panes">
        {showEditor && (
          <div className="ac-editor-pane">
            <div className="ac-pane-header">Editor</div>
            <div className="ac-editor-hint">
              💡 Para equações, escreve <strong>$fórmula$</strong> no texto (ex: <code>$x^2 + y^2$</code>)
            </div>
            <div className="ac-tiptap" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <TiptapEditor
                value={richContent}
                onChange={setRichContent}
                placeholder="Começa a escrever o resumo aqui…"
              />
            </div>
          </div>
        )}

        {showPreview && (
          <div className="ac-preview-pane">
            <div className="ac-pane-header">Preview</div>
            <div
              ref={previewRef}
              className="ac-preview-content"
              dangerouslySetInnerHTML={{ __html: richContent }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
