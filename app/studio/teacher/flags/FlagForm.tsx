"use client";

import { useActionState } from "react";
import { submitFlag } from "../actions";

export function FlagForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return await submitFlag(formData);
    },
    null
  );

  return (
    <form action={formAction} className="st-form">
      {state?.error && <div className="st-feedback error">{state.error}</div>}

      <input type="hidden" name="email" value={email} />

      <div className="st-field">
        <label className="st-label st-label-required" htmlFor="flag-type">Tipo de problema</label>
        <select name="flag_type" id="flag-type" className="st-select" required defaultValue="">
          <option value="" disabled>Seleciona...</option>
          <option value="erro_mcq">❌ Erro numa pergunta MCQ</option>
          <option value="erro_conteudo">📝 Erro em conteúdo educativo</option>
          <option value="conteudo_em_falta">📚 Conteúdo em falta</option>
          <option value="classificacao_errada">🏷️ Classificação errada</option>
          <option value="outro">📎 Outro</option>
        </select>
      </div>

      <div className="st-field">
        <label className="st-label st-label-required" htmlFor="flag-desc">Descrição do problema</label>
        <textarea name="description" id="flag-desc" className="st-textarea" required placeholder="Descreve o que está errado ou em falta..." rows={4} />
      </div>

      <div className="st-field">
        <label className="st-label" htmlFor="flag-ref">Referência (opcional)</label>
        <input type="text" name="reference" id="flag-ref" className="st-input" placeholder="ID da pergunta, URL, nome do subtema..." />
        <span className="st-hint">Ajuda-nos a encontrar o problema mais rápido.</span>
      </div>

      <div className="st-form-actions">
        <button type="submit" className="st-btn st-btn--primary" disabled={isPending}>
          {isPending ? "A enviar..." : "🚩 Enviar flag"}
        </button>
      </div>
    </form>
  );
}
