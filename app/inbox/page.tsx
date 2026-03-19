import { getLatestReviewBrief } from "@/lib/ops-data";
import { InboxFeed } from "@/components/inbox-feed";
import { Layers } from "lucide-react";
import { requireManagerUser } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export default async function TodayDashboard() {
  await requireManagerUser();
  const latestBrief = await getLatestReviewBrief();

  const rawCases = latestBrief?.cases ?? [];
  const packages = rawCases
    .filter((c) => c.category !== "editorial")
    .map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    problem: c.problem,
    impact: c.impact || c.expectedOutcome,
    expectedOutcome: c.expectedOutcome,
    pendingCount: c.pendingCount,
    decisionStatus: c.decisionStatus as "pending" | "accepted" | "deferred" | "ignored",
  }));

  const pendingPackages = packages.filter(p => p.decisionStatus === "pending");

  if (pendingPackages.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 100px)" }}>
        <Layers size={64} style={{ color: "var(--muted-soft)", opacity: 0.5, marginBottom: 24 }} />
        <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}>Semana calma</h2>
        <p style={{ color: "var(--muted)", fontSize: "1.1rem", maxWidth: 620, textAlign: "center" }}>
          Não há casos curriculares ou operacionais prioritários para rever neste momento.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
         <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Inbox</h1>
            <p style={{ fontSize: "1.1rem", color: "var(--muted)" }}>
              {latestBrief
                ? `Existe uma revisão ativa e tens ${pendingPackages.length} casos por decidir.`
                : `Tens ${pendingPackages.length} casos por decidir.`}
            </p>
         </div>
      </header>

      <InboxFeed packages={pendingPackages} />
    </div>
  );
}
