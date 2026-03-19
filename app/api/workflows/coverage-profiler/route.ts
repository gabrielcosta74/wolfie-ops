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

  const response = await fetch(`${env.supabaseUrl}/functions/v1/coverage-profiler`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-ops-secret": env.agentOpsSharedSecret,
    },
    body: JSON.stringify({
      workflow_code: "coverage-profiler",
    }),
  });

  const payload = await response.json().catch(() => ({
    ok: false,
    message: "Invalid JSON response from coverage-profiler",
  }));

  return NextResponse.json(payload, { status: response.status });
}
