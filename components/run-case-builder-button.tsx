"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function RunCaseBuilderButton({
  periodType = "weekly",
}: {
  periodType?: "weekly" | "monthly" | "manual";
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/workflows/case-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period_type: periodType }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao correr case-builder");
      }

      setMessage(`Casos atualizados: ${payload.cases_built}`);
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
        {isPending ? "A agrupar..." : "Atualizar casos"}
      </button>
      {message ? <span className="metric-note">{message}</span> : null}
    </div>
  );
}
