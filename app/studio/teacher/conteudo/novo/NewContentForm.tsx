"use client";

import { useActionState } from "react";
import { createContent } from "../../actions";

type Option = { id: number; label: string };

export function NewContentForm({ subtemas }: { subtemas: Option[] }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return await createContent(formData);
    },
    null
  );

  return (
    <form action={formAction} className="st-form">
      {state?.error && <div className="st-feedback error">{state.error}</div>}

      <div className="st-field">
        <label className="st-label st-label-required" htmlFor="nc-title">Título</label>
        <input type="text" name="title" id="nc-title" className="st-input" required maxLength={200} placeholder="Ex: Derivadas — regra do quociente" />
      </div>

      <div className="st-field-row">
        <div className="st-field">
          <label className="st-label st-label-required" htmlFor="nc-type">Tipo</label>
          <select name="type" id="nc-type" className="st-select" required defaultValue="">
            <option value="" disabled>Seleciona...</option>
            <option value="video">📹 Vídeo</option>
            <option value="summary">📝 Resumo</option>
            <option value="cheat_sheet">📋 Cheat Sheet</option>
            <option value="exercise_set">✏️ Exercícios</option>
          </select>
        </div>
        <div className="st-field">
          <label className="st-label st-label-required" htmlFor="nc-subtema">Subtema</label>
          <select name="subtema_id" id="nc-subtema" className="st-select" required defaultValue="">
            <option value="" disabled>Seleciona...</option>
            {subtemas.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="st-field">
        <label className="st-label" htmlFor="nc-video">URL do vídeo (opcional)</label>
        <input type="url" name="video_url" id="nc-video" className="st-input" placeholder="https://youtube.com/watch?v=..." />
      </div>

      <div className="st-field">
        <label className="st-label" htmlFor="nc-content">Conteúdo (Markdown)</label>
        <textarea name="markdown_content" id="nc-content" className="st-textarea" placeholder="Escreve o resumo em markdown..." rows={8} />
      </div>

      <div className="st-form-actions">
        <button type="submit" className="st-btn st-btn--primary" disabled={isPending}>
          {isPending ? "A guardar..." : "Publicar conteúdo"}
        </button>
      </div>
    </form>
  );
}
