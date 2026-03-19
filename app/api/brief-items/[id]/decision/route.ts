import { NextRequest, NextResponse } from "next/server";
import { requireManagerApiUser } from "@/lib/ops-auth";
import { rejectUntrustedOriginForRoute } from "@/lib/request-security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Decision = "approved" | "deferred" | "ignored";

function mapProposalDecision(decision: Decision) {
  if (decision === "approved") {
    return {
      briefStatus: "approved",
      proposalStatus: "approved",
      findingStatus: "approved",
      reviewDecision: "approved",
    } as const;
  }

  if (decision === "ignored") {
    return {
      briefStatus: "ignored",
      proposalStatus: "rejected",
      findingStatus: "rejected",
      reviewDecision: "rejected",
    } as const;
  }

  return {
    briefStatus: "deferred",
    proposalStatus: null,
    findingStatus: null,
    reviewDecision: "commented",
  } as const;
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const originError = rejectUntrustedOriginForRoute(req);
  if (originError) return originError;

  const actor = await requireManagerApiUser();
  if (actor instanceof NextResponse) return actor;

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const decision = body?.decision as Decision | undefined;
  const notes = typeof body?.notes === "string" ? body.notes : null;

  if (!decision || !["approved", "deferred", "ignored"].includes(decision)) {
    return NextResponse.json({ ok: false, message: "Invalid decision" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const reviewerLabel = actor.email ?? actor.id;

  const { data: item, error: itemError } = await supabase
    .from("review_brief_items")
    .select("id, brief_id, proposal_id, finding_id, decision_status")
    .eq("id", id)
    .maybeSingle();

  if (itemError) {
    return NextResponse.json({ ok: false, message: itemError.message }, { status: 500 });
  }

  if (!item) {
    return NextResponse.json({ ok: false, message: "Brief item not found" }, { status: 404 });
  }

  const decisionMap = mapProposalDecision(decision);
  const reviewedAt = new Date().toISOString();

  const { error: updateItemError } = await supabase
    .from("review_brief_items")
    .update({
      decision_status: decisionMap.briefStatus,
      metadata: {
        reviewed_via: "wolfie-ops-brief",
        reviewer_label: reviewerLabel,
        notes,
        reviewed_at: reviewedAt,
      },
    })
    .eq("id", id);

  if (updateItemError) {
    return NextResponse.json({ ok: false, message: updateItemError.message }, { status: 500 });
  }

  if (item.proposal_id && decisionMap.proposalStatus) {
    const { error: reviewError } = await supabase.from("agent_reviews").insert({
      proposal_id: item.proposal_id,
      reviewer_type: "human",
      decision: decisionMap.reviewDecision,
      notes,
      metadata: {
        reviewer_label: reviewerLabel,
        via: "wolfie-ops-brief",
        brief_item_id: id,
      },
    });

    if (reviewError) {
      return NextResponse.json({ ok: false, message: reviewError.message }, { status: 500 });
    }

    const { error: proposalError } = await supabase
      .from("agent_proposals")
      .update({
        status: decisionMap.proposalStatus,
        reviewed_at: reviewedAt,
      })
      .eq("id", item.proposal_id);

    if (proposalError) {
      return NextResponse.json({ ok: false, message: proposalError.message }, { status: 500 });
    }
  } else if (item.proposal_id && decisionMap.reviewDecision === "commented") {
    const { error: reviewError } = await supabase.from("agent_reviews").insert({
      proposal_id: item.proposal_id,
      reviewer_type: "human",
      decision: "commented",
      notes: notes || "Adiado a partir do review brief.",
      metadata: {
        reviewer_label: reviewerLabel,
        via: "wolfie-ops-brief",
        brief_item_id: id,
      },
    });

    if (reviewError) {
      return NextResponse.json({ ok: false, message: reviewError.message }, { status: 500 });
    }
  }

  if (item.finding_id && decisionMap.findingStatus) {
    const { error: findingError } = await supabase
      .from("agent_findings")
      .update({
        status: decisionMap.findingStatus,
      })
      .eq("id", item.finding_id);

    if (findingError) {
      return NextResponse.json({ ok: false, message: findingError.message }, { status: 500 });
    }
  }

  const { count: pendingCount, error: pendingError } = await supabase
    .from("review_brief_items")
    .select("id", { count: "exact", head: true })
    .eq("brief_id", item.brief_id)
    .eq("decision_status", "pending");

  if (pendingError) {
    return NextResponse.json({ ok: false, message: pendingError.message }, { status: 500 });
  }

  if ((pendingCount ?? 0) === 0) {
    await supabase
      .from("review_briefs")
      .update({
        status: "completed",
        completed_at: reviewedAt,
      })
      .eq("id", item.brief_id);
  }

  return NextResponse.json({
    ok: true,
    brief_item_id: id,
    decision,
    brief_status: decisionMap.briefStatus,
    proposal_status: decisionMap.proposalStatus,
  });
}
