import { NextResponse } from "next/server";
import { getOpsEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST() {
  const env = getOpsEnv();

  const response = await fetch(`${env.supabaseUrl}/functions/v1/official-monitor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-ops-secret": env.agentOpsSharedSecret,
    },
    body: JSON.stringify({
      workflow_code: "official-monitor",
    }),
  });

  const payload = await response.json().catch(() => ({
    ok: false,
    message: "Invalid JSON response from official-monitor",
  }));

  return NextResponse.json(payload, { status: response.status });
}
