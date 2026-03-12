"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function RunQuestionBankProfilerButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/workflows/question-bank-profiler", {
        method: "POST",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao correr question-bank-profiler");
      }

      setMessage(`${payload.profiled_count} perguntas analisadas, ${payload.promoted_count} sinalizadas.`);
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
        {isPending ? "A analisar..." : "Analisar cobertura"}
      </button>
      {message ? <span className="metric-note">{message}</span> : null}
    </div>
  );
}
