"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

export function GenerateCaseDraftButton({
  briefId,
  caseId,
  currentDraftStatus,
}: {
  briefId: string;
  caseId: string;
  currentDraftStatus?: string | null;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/briefs/${briefId}/cases/${encodeURIComponent(caseId)}/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao gerar proposta concreta");
      }

      setMessage("Proposta concreta preparada.");
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
    <div style={{ display: "grid", gap: 10, alignItems: "start" }}>
      <button className="button" disabled={isPending} onClick={handleClick} type="button">
        {isPending
          ? "A preparar..."
          : currentDraftStatus === "ready"
            ? "Regenerar proposta concreta"
            : "Preparar proposta concreta"}
      </button>
      {message ? <span className="metric-note">{message}</span> : null}
    </div>
  );
}
