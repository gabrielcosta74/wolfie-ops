"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Check, X, Clock } from "lucide-react";

type Decision = "accepted" | "deferred" | "ignored";

export function CaseDecisionPanel({
  briefId,
  caseId,
  currentStatus,
}: {
  briefId: string;
  caseId: string;
  currentStatus: "pending" | "accepted" | "deferred" | "ignored";
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const locked = currentStatus === "ignored";

  async function submit(decision: Decision) {
    setIsPending(true);

    try {
      const response = await fetch(`/api/briefs/${briefId}/cases/${encodeURIComponent(caseId)}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision, notes: "" }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Falha ao guardar decisão do caso");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="sticky-action-bar">
      <button 
        className="action-btn reject" 
        disabled={isPending || locked} 
        onClick={() => submit("ignored")} 
        type="button"
        title="Descartar caso"
      >
        <X size={18} />
      </button>
      
      <button 
        className="action-btn defer" 
        disabled={isPending || locked} 
        onClick={() => submit("deferred")} 
        type="button"
        title="Adiar"
      >
        <Clock size={18} /> Adiar
      </button>
      
      <button 
        className="action-btn approve" 
        disabled={isPending || locked} 
        onClick={() => submit("accepted")} 
        type="button"
      >
        <Check size={18} /> Aceitar caso
      </button>
    </div>
  );
}
