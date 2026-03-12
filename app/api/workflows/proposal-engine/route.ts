import { NextResponse } from "next/server";
import { getOpsEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST() {
  const env = getOpsEnv();

  const response = await fetch(`${env.supabaseUrl}/functions/v1/proposal-engine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-ops-secret": env.agentOpsSharedSecret,
    },
    body: JSON.stringify({
      workflow_code: "proposal-engine",
    }),
  });

  const payload = await response.json().catch(() => ({
    ok: false,
    message: "Invalid JSON response from proposal-engine",
  }));

  return NextResponse.json(payload, { status: response.status });
}
