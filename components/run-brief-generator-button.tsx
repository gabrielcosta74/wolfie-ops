"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function RunBriefGeneratorButton({
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
      const response = await fetch("/api/workflows/brief-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period_type: periodType }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao correr brief-generator");
      }

      const casesBuilt =
        typeof payload?.case_builder?.cases_built === "number" ? payload.case_builder.cases_built : null;
      setMessage(
        casesBuilt != null
          ? `Revisão criada: ${casesBuilt} casos prontos para a Inbox.`
          : `Revisão criada: ${payload.items_built} itens agrupados.`,
      );
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
        {isPending ? "A gerar..." : "Gerar revisão"}
      </button>
      {message ? <span className="metric-note">{message}</span> : null}
    </div>
  );
}
