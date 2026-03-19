import { NextRequest, NextResponse } from "next/server";
import { getOpsEnv } from "@/lib/env";
import { requireManagerApiUser } from "@/lib/ops-auth";
import { rejectUntrustedOriginForRoute } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originError = rejectUntrustedOriginForRoute(request);
  if (originError) return originError;

  const actor = await requireManagerApiUser();
  if (actor instanceof NextResponse) return actor;

  const env = getOpsEnv();
  const body = await request.json().catch(() => ({}));
  const briefId = typeof body?.brief_id === "string" ? body.brief_id : undefined;
  const periodType =
    body?.period_type === "monthly" || body?.period_type === "manual" ? body.period_type : "weekly";

  const response = await fetch(`${env.supabaseUrl}/functions/v1/case-builder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-ops-secret": env.agentOpsSharedSecret,
    },
    body: JSON.stringify({
      workflow_code: "case-builder",
      brief_id: briefId,
      period_type: periodType,
    }),
  });

  const payload = await response.json().catch(() => ({
    ok: false,
    message: "Invalid JSON response from case-builder",
  }));

  return NextResponse.json(payload, { status: response.status });
}
