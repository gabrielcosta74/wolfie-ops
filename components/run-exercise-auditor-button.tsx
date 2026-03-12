"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function RunExerciseAuditorButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/workflows/exercise-auditor", {
        method: "POST",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao correr exercise-auditor");
      }

      setMessage(`${payload.reviewed_count} fontes verificadas, ${payload.findings_created} sinais encontrados.`);
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
        {isPending ? "A monitorizar..." : "Monitorizar fontes"}
      </button>
      {message ? <span className="metric-note">{message}</span> : null}
    </div>
  );
}
