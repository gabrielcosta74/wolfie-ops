import { NextRequest, NextResponse } from "next/server";
import { getOpsEnv } from "@/lib/env";
import { requireManagerApiUser } from "@/lib/ops-auth";
import { rejectUntrustedOriginForRoute } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; caseId: string }> },
) {
  const originError = rejectUntrustedOriginForRoute(request);
  if (originError) return originError;

  const actor = await requireManagerApiUser();
  if (actor instanceof NextResponse) return actor;

  const env = getOpsEnv();
  const { id, caseId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const response = await fetch(`${env.supabaseUrl}/functions/v1/draft-generator`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-ops-secret": env.agentOpsSharedSecret,
    },
    body: JSON.stringify({
      workflow_code: "draft-generator",
      brief_id: id,
      case_id: caseId,
      dry_run: Boolean(body?.dry_run),
    }),
  });

  const payload = await response.json().catch(() => ({
    ok: false,
    message: "Invalid JSON response from draft-generator",
  }));

  return NextResponse.json(payload, { status: response.status });
}
