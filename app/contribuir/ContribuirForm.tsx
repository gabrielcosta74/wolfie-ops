"use client";

import { useActionState } from "react";
import { submitContribution } from "./actions";

type SubtemaOption = { id: number; label: string };

export function ContribuirForm({ subtemas }: { subtemas: SubtemaOption[] }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return await submitContribution(formData);
    },
    null
  );

  return (
    <form action={formAction} className="ct-form">
      {state?.error && <div className="ct-error">{state.error}</div>}

      {/* Tipo */}
      <div className="ct-field">
        <label className="ct-label ct-label-required" htmlFor="ct-type">Tipo de conteúdo</label>
        <select name="type" id="ct-type" className="ct-select" required defaultValue="">
          <option value="" disabled>Seleciona o tipo...</option>
          <option value="video">📹 Vídeo</option>
          <option value="resumo">📝 Resumo</option>
          <option value="exercicio">✏️ Exercício</option>
          <option value="outro">📎 Outro</option>
        </select>
      </div>

      {/* Título */}
      <div className="ct-field">
        <label className="ct-label ct-label-required" htmlFor="ct-title">Título / Descrição breve</label>
        <input
          type="text"
          name="title"
          id="ct-title"
          className="ct-input"
          placeholder="Ex: Derivadas — explicação com exemplos práticos"
          required
          maxLength={200}
        />
      </div>

      {/* Subtema */}
      <div className="ct-field">
        <label className="ct-label" htmlFor="ct-subtema">Subtema (opcional)</label>
        <select name="subtema_id" id="ct-subtema" className="ct-select" defaultValue="">
          <option value="">Não sei / Geral</option>
          {subtemas.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <span className="ct-hint">Ajuda-nos a classificar a tua sugestão.</span>
      </div>

      {/* URL */}
      <div className="ct-field">
        <label className="ct-label" htmlFor="ct-url">URL do recurso</label>
        <input
          type="url"
          name="url"
          id="ct-url"
          className="ct-input"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      {/* Texto livre */}
      <div className="ct-field">
        <label className="ct-label" htmlFor="ct-content">Ou descreve o conteúdo</label>
        <textarea
          name="content"
          id="ct-content"
          className="ct-textarea"
          placeholder="Descreve aqui o exercício, resumo ou ideia..."
          rows={4}
        />
        <span className="ct-hint">Preenche o URL, a descrição, ou ambos.</span>
      </div>

      {/* Email + Escola (optional row) */}
      <div className="ct-field-row">
        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-email">Email (opcional)</label>
          <input
            type="email"
            name="email"
            id="ct-email"
            className="ct-input"
            placeholder="teu@email.com"
          />
        </div>
        <div className="ct-field">
          <label className="ct-label" htmlFor="ct-escola">Escola (opcional)</label>
          <input
            type="text"
            name="escola"
            id="ct-escola"
            className="ct-input"
            placeholder="Nome da escola"
            maxLength={100}
          />
        </div>
      </div>

      <button type="submit" className="ct-submit" disabled={isPending}>
        {isPending ? "A enviar..." : "🚀 Enviar sugestão"}
      </button>
    </form>
  );
}
