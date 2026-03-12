import { getLatestReviewBrief } from "@/lib/ops-data";
import { notFound } from "next/navigation";
import { FocusTriageView } from "@/components/focus-triage-view";

export const dynamic = "force-dynamic";

export default async function FocusDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseId = decodeURIComponent(id);
  const latestBrief = await getLatestReviewBrief();
  
  const rawCases = (latestBrief?.cases ?? []).filter((reviewCase) => reviewCase.category !== "editorial");
  const rawPkg = rawCases.find(c => c.id === caseId);

  if (!rawPkg) {
    notFound();
  }

  const pkg = {
    briefId: latestBrief.id,
    id: rawPkg.id,
    title: rawPkg.title,
    category: rawPkg.category,
    actionType: rawPkg.actionType,
    problem: rawPkg.problem,
    summary: rawPkg.summary,
    impact: rawPkg.impact || rawPkg.expectedOutcome,
    expectedOutcome: rawPkg.expectedOutcome,
    pendingCount: rawPkg.pendingCount,
    decisionStatus: rawPkg.decisionStatus as "pending" | "accepted" | "deferred" | "ignored",
    humanStatus: rawPkg.humanStatus,
    draftStatus: rawPkg.draftStatus,
    draftPackage: rawPkg.draftPackage,
    items: rawPkg.items.map((i: any) => ({
      id: i.id,
      title: i.title || "Exercício sem título",
      problem: i.problem,
      impact: i.impact,
      expectedOutcome: i.expectedOutcome,
      changeSummary: i.changeSummary,
      metadata: i.metadata ?? {},
    }))
  };

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <FocusTriageView pkg={pkg} />
    </div>
  );
}
