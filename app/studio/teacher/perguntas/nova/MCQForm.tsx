"use client";

import { useActionState } from "react";
import { createMCQ } from "../../actions";

type Option = { id: number; label: string };

export function MCQForm({ subtemas, email }: { subtemas: Option[]; email: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return await createMCQ(formData);
    },
    null
  );

  return (
    <form action={formAction} className="st-form">
      {state?.error && <div className="st-feedback error">{state.error}</div>}

      <input type="hidden" name="submitted_by_email" value={email} />

      <div className="st-field">
        <label className="st-label st-label-required" htmlFor="mcq-pergunta">Enunciado da pergunta</label>
        <textarea name="pergunta" id="mcq-pergunta" className="st-textarea" required placeholder="Qual das seguintes afirmações é verdadeira..." rows={3} />
      </div>

      <div className="st-field-row">
        <div className="st-field">
          <label className="st-label st-label-required" htmlFor="mcq-a">Opção A</label>
          <input type="text" name="opcao_a" id="mcq-a" className="st-input" required />
        </div>
        <div className="st-field">
          <label className="st-label st-label-required" htmlFor="mcq-b">Opção B</label>
          <input type="text" name="opcao_b" id="mcq-b" className="st-input" required />
        </div>
      </div>

      <div className="st-field-row">
        <div className="st-field">
          <label className="st-label st-label-required" htmlFor="mcq-c">Opção C</label>
          <input type="text" name="opcao_c" id="mcq-c" className="st-input" required />
        </div>
        <div className="st-field">
          <label className="st-label st-label-required" htmlFor="mcq-d">Opção D</label>
          <input type="text" name="opcao_d" id="mcq-d" className="st-input" required />
        </div>
      </div>

      <div className="st-field-row">
        <div className="st-field">
          <label className="st-label st-label-required" htmlFor="mcq-correta">Opção correta</label>
          <select name="opcao_correta" id="mcq-correta" className="st-select" required defaultValue="">
            <option value="" disabled>Seleciona...</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div className="st-field">
          <label className="st-label" htmlFor="mcq-dif">Dificuldade</label>
          <select name="dificuldade" id="mcq-dif" className="st-select" defaultValue="medio">
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
      </div>

      <div className="st-field">
        <label className="st-label st-label-required" htmlFor="mcq-subtema">Subtema</label>
        <select name="subtema_id" id="mcq-subtema" className="st-select" required defaultValue="">
          <option value="" disabled>Seleciona...</option>
          {subtemas.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="st-field">
        <label className="st-label st-label-required" htmlFor="mcq-explicacao">Explicação</label>
        <textarea name="explicacao" id="mcq-explicacao" className="st-textarea" required placeholder="Explica porque é que a resposta correta é a certa e as outras são erradas..." rows={4} />
      </div>

      <div className="st-form-actions">
        <button type="submit" className="st-btn st-btn--primary" disabled={isPending}>
          {isPending ? "A submeter..." : "Submeter pergunta"}
        </button>
      </div>
    </form>
  );
}
