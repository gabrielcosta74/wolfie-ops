"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type Decision = "approved" | "deferred" | "ignored";

export function BriefItemDecisionPanel({
  itemId,
  currentStatus,
  approveLabel,
  deferLabel,
  ignoreLabel,
  helperText,
}: {
  itemId: string;
  currentStatus: string;
  approveLabel: string;
  deferLabel: string;
  ignoreLabel: string;
  helperText?: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const locked = currentStatus === "approved" || currentStatus === "ignored" || currentStatus === "executed";

  async function submit(decision: Decision) {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/brief-items/${itemId}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision, notes }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao guardar decisão do brief");
      }

      setMessage(`Decisão guardada: ${decision}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="stack-sm">
      {helperText ? (
        <p className="description" style={{ margin: 0 }}>
          {helperText}
        </p>
      ) : null}
      <textarea
        className="textarea"
        placeholder="Notas opcionais para contextualizar a decisão..."
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <div className="action-row">
        <button className="button" disabled={isPending || locked} onClick={() => submit("approved")} type="button">
          {approveLabel}
        </button>
        <button className="button secondary" disabled={isPending || locked} onClick={() => submit("deferred")} type="button">
          {deferLabel}
        </button>
        <button className="button danger" disabled={isPending || locked} onClick={() => submit("ignored")} type="button">
          {ignoreLabel}
        </button>
      </div>
      {message ? <span className="metric-note">{message}</span> : null}
    </div>
  );
}
