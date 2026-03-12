"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Eye, X } from "lucide-react";

export function SignalInlineTriage({ findingId, currentStatus }: { findingId: string, currentStatus: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleTriage(status: string) {
    setIsPending(true);
    try {
      const res = await fetch(`/api/signals/${findingId}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        startTransition(() => {
          router.refresh();
        });
      }
    } finally {
      setIsPending(false);
    }
  }

  if (currentStatus !== "new") {
    return <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Triado ({currentStatus})</span>;
  }

  return (
    <div className="flex-row" style={{ gap: 8 }}>
      <button 
        disabled={isPending} 
        onClick={(e) => { e.preventDefault(); handleTriage("promoted"); }}
        title="Promover a Proposal"
        style={{ padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text)", fontSize: "0.80rem" }}
      >
        <ArrowUpRight size={14} style={{ color: "var(--success)" }} /> Promover
      </button>
      <button 
        disabled={isPending} 
        onClick={(e) => { e.preventDefault(); handleTriage("monitored"); }}
        title="Apenas Monitorizar"
        style={{ padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text)", fontSize: "0.80rem" }}
      >
        <Eye size={14} style={{ color: "var(--info)" }} /> Observar
      </button>
      <button 
        disabled={isPending} 
        onClick={(e) => { e.preventDefault(); handleTriage("ignored"); }}
        title="Ruído / Ignorar"
        style={{ padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text)", fontSize: "0.80rem" }}
      >
        <X size={14} style={{ color: "var(--muted-soft)" }} /> Ignorar
      </button>
    </div>
  );
}
