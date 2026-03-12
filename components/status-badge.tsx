import type { ReactNode } from "react";

type BadgeKind =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled"
  | "needs_review"
  | "new"
  | "triaged"
  | "pending_proposal"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived"
  | "commented"
  | "draft"
  | "executed"
  | "needs_revision"
  | "superseded"
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "success"
  | "neutral"
  | "pending"
  | "skipped"
  | "danger"
  | "warning"
  | "info";

function kindToTone(kind: BadgeKind) {
  if (["succeeded", "approved", "executed", "success"].includes(kind)) return "success";
  if (["failed", "rejected", "critical", "danger"].includes(kind)) return "danger";
  if (
    [
      "running",
      "needs_review",
      "pending",
      "pending_review",
      "pending_proposal",
      "needs_revision",
      "medium",
      "high",
    ].includes(kind)
  ) {
    return "warning";
  }

  return "neutral";
}

export function StatusBadge({ kind, children }: { kind: BadgeKind; children: ReactNode }) {
  return <span className={`badge ${kindToTone(kind)}`}>{children}</span>;
}
