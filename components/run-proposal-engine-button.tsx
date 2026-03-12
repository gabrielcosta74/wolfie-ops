"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function RunProposalEngineButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/workflows/proposal-engine", {
        method: "POST",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao correr proposal-engine");
      }

      setMessage(`Criadas ${payload.proposals_created} proposals`);
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
    <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
      <button className="button secondary" disabled={isPending} onClick={handleClick} type="button">
        {isPending ? "A gerar..." : "Run proposal-engine"}
      </button>
      {message ? <span className="metric-note">{message}</span> : null}
    </div>
  );
}
