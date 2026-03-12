import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Decision = "accepted" | "deferred" | "ignored";

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; caseId: string }> },
) {
  const { id, caseId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const decision = body?.decision as Decision | undefined;
  const notes = typeof body?.notes === "string" ? body.notes : null;

  if (!decision || !["accepted", "deferred", "ignored"].includes(decision)) {
    return NextResponse.json({ ok: false, message: "Invalid decision" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const reviewerLabel = getReviewerLabel(req);
  const reviewedAt = new Date().toISOString();

  const { data: reviewCase, error: caseError } = await supabase
    .from("review_cases")
    .select("id, brief_id")
    .eq("id", caseId)
    .eq("brief_id", id)
    .maybeSingle();

  if (caseError) {
    return NextResponse.json({ ok: false, message: caseError.message }, { status: 500 });
  }

  if (!reviewCase) {
    return NextResponse.json({ ok: false, message: "Case not found" }, { status: 404 });
  }

  const { error: updateCaseError } = await supabase
    .from("review_cases")
    .update({
      decision_status: decision,
      reviewed_at: reviewedAt,
      reviewer_label: reviewerLabel,
      review_notes: notes,
      status: "completed",
    })
    .eq("id", caseId);

  if (updateCaseError) {
    return NextResponse.json({ ok: false, message: updateCaseError.message }, { status: 500 });
  }

  const { data: caseItemsData, error: caseItemsError } = await supabase
    .from("review_case_items")
    .select("brief_item_id")
    .eq("case_id", caseId);

  if (caseItemsError) {
    return NextResponse.json({ ok: false, message: caseItemsError.message }, { status: 500 });
  }

  const itemIds = (caseItemsData ?? [])
    .map((row) => (row as Record<string, unknown>).brief_item_id)
    .filter((item): item is string => typeof item === "string");

  if (itemIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabase
      .from("review_brief_items")
      .select("id, metadata")
      .in("id", itemIds);

    if (itemsError) {
      return NextResponse.json({ ok: false, message: itemsError.message }, { status: 500 });
    }

    const briefItemDecision =
      decision === "accepted" ? "approved" : decision === "deferred" ? "deferred" : "ignored";

    for (const item of itemsData ?? []) {
      const currentMetadata =
        item?.metadata && typeof item.metadata === "object" ? (item.metadata as Record<string, unknown>) : {};
      const nextItemMetadata = {
        ...currentMetadata,
        case_id: caseId,
        case_decision_status: decision,
        case_reviewed_at: reviewedAt,
        case_reviewer_label: reviewerLabel,
      };

      await supabase
        .from("review_brief_items")
        .update({
          decision_status: briefItemDecision,
          metadata: nextItemMetadata,
        })
        .eq("id", item.id);
    }
  }

  const { data: brief, error: briefError } = await supabase
    .from("review_briefs")
    .select("id, metadata")
    .eq("id", id)
    .maybeSingle();

  if (briefError) {
    return NextResponse.json({ ok: false, message: briefError.message }, { status: 500 });
  }

  if (brief) {
    const existingCases = Array.isArray(brief.metadata?.case_groups)
      ? (brief.metadata.case_groups as Array<Record<string, unknown>>)
      : [];

    const nextCases: Array<Record<string, unknown>> = existingCases.map((entry) => {
      if (!entry || typeof entry !== "object" || entry.id !== caseId) {
        return entry;
      }

      return {
        ...entry,
        decisionStatus: decision,
        reviewedAt,
        reviewerLabel,
        reviewNotes: notes,
      };
    });

    await supabase
      .from("review_briefs")
      .update({
        metadata: {
          ...(brief.metadata ?? {}),
          case_groups: nextCases,
          case_groups_updated_at: reviewedAt,
        },
      })
      .eq("id", id);
  }

  const { count: pendingCasesCount, error: pendingCasesError } = await supabase
    .from("review_cases")
    .select("id", { count: "exact", head: true })
    .eq("brief_id", id)
    .eq("decision_status", "pending")
    .neq("status", "archived");

  if (pendingCasesError) {
    return NextResponse.json({ ok: false, message: pendingCasesError.message }, { status: 500 });
  }

  if ((pendingCasesCount ?? 0) === 0) {
    await supabase
      .from("review_briefs")
      .update({
        status: "completed",
        completed_at: reviewedAt,
      })
      .eq("id", id);
  }

  return NextResponse.json({
    ok: true,
    brief_id: id,
    case_id: caseId,
    decision,
  });
}
