"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type Decision = "approved" | "rejected" | "needs_revision";

export function ProposalReviewPanel({
  proposalId,
  currentStatus,
  proposalType,
}: {
  proposalId: string;
  currentStatus: string;
  proposalType: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(decision: Decision) {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision, notes }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao guardar review");
      }

      setMessage(`Decision saved: ${decision}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setIsPending(false);
    }
  }

  const locked = currentStatus === "executed" || currentStatus === "superseded";

  const approveLabel =
    proposalType === "execution_plan"
      ? "Aprovar Plano"
      : proposalType === "report"
        ? "Validar Sinal"
        : "Aprovar";

  const rejectLabel =
    proposalType === "execution_plan"
      ? "Rejeitar Plano"
      : proposalType === "report"
        ? "Descartar Acusação"
        : "Rejeitar";

  return (
    <div className="list-stack">
      <div className="stack-item">
        <strong>Ação Requerida</strong>
        <p className="description">
          A tua decisão será registada associada ao teu utilizador em `agent_reviews`. Adiciona notas se quiseres contextualizar.
        </p>
      </div>

      <div className="field-stack">
        <label className="field-label" htmlFor="proposal-review-notes">
          Notas de revisão (Opcional)
        </label>
        <textarea
          id="proposal-review-notes"
          className="textarea"
          placeholder="Racional da decisão, instruções para a próxima fase..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="action-row">
        <button
          className="button"
          disabled={isPending || locked}
          onClick={() => submit("approved")}
          type="button"
        >
          {approveLabel}
        </button>
        <button
          className="button warning"
          disabled={isPending || locked}
          onClick={() => submit("needs_revision")}
          type="button"
        >
          Pedir revisão
        </button>
        <button
          className="button danger"
          disabled={isPending || locked}
          onClick={() => submit("rejected")}
          type="button"
        >
          {rejectLabel}
        </button>
      </div>

      {message ? <span className="metric-note">{message}</span> : null}
    </div>
  );
}
