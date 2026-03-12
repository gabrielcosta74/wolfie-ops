import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Decision = "approved" | "rejected" | "needs_revision";

function getReviewerLabel(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return "ops-admin";
  }

  try {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return "ops-admin";
    return decoded.slice(0, separator) || "ops-admin";
  } catch {
    return "ops-admin";
  }
}

function mapStatuses(decision: Decision) {
  if (decision === "approved") {
    return { proposalStatus: "approved", findingStatus: "approved" };
  }

  if (decision === "rejected") {
    return { proposalStatus: "rejected", findingStatus: "rejected" };
  }

  return { proposalStatus: "needs_revision", findingStatus: "pending_proposal" };
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const decision = body?.decision as Decision | undefined;
  const notes = typeof body?.notes === "string" ? body.notes : null;

  if (!decision || !["approved", "rejected", "needs_revision"].includes(decision)) {
    return NextResponse.json({ ok: false, message: "Invalid decision" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const reviewerLabel = getReviewerLabel(req);

  const { data: proposal, error: proposalError } = await supabase
    .from("agent_proposals")
    .select("id, finding_id, status")
    .eq("id", id)
    .maybeSingle();

  if (proposalError) {
    return NextResponse.json({ ok: false, message: proposalError.message }, { status: 500 });
  }

  if (!proposal) {
    return NextResponse.json({ ok: false, message: "Proposal not found" }, { status: 404 });
  }

  const { proposalStatus, findingStatus } = mapStatuses(decision);
  const reviewedAt = new Date().toISOString();

  const { error: reviewError } = await supabase.from("agent_reviews").insert({
    proposal_id: id,
    reviewer_type: "human",
    decision,
    notes,
    metadata: {
      reviewer_label: reviewerLabel,
      via: "wolfie-ops",
    },
  });

  if (reviewError) {
    return NextResponse.json({ ok: false, message: reviewError.message }, { status: 500 });
  }

  const { error: updateProposalError } = await supabase
    .from("agent_proposals")
    .update({
      status: proposalStatus,
      reviewed_at: reviewedAt,
    })
    .eq("id", id);

  if (updateProposalError) {
    return NextResponse.json({ ok: false, message: updateProposalError.message }, { status: 500 });
  }

  if (proposal.finding_id) {
    const { error: updateFindingError } = await supabase
      .from("agent_findings")
      .update({
        status: findingStatus,
      })
      .eq("id", proposal.finding_id);

    if (updateFindingError) {
      return NextResponse.json({ ok: false, message: updateFindingError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    proposal_id: id,
    decision,
    proposal_status: proposalStatus,
    finding_status: findingStatus,
  });
}
