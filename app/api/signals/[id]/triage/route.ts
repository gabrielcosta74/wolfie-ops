import { NextRequest, NextResponse } from "next/server";
import { requireManagerApiUser } from "@/lib/ops-auth";
import { rejectUntrustedOriginForRoute } from "@/lib/request-security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest, paramsGroup: { params: Promise<{ id: string }> }) {
  try {
    const originError = rejectUntrustedOriginForRoute(request);
    if (originError) return originError;

    const actor = await requireManagerApiUser();
    if (actor instanceof NextResponse) return actor;

    const { id } = await paramsGroup.params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["ignored", "monitored", "promoted"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, message: "Invalid status" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("agent_findings")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
    
    // In a complete flow, "promoted" would insert a row in agent_proposals.
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
