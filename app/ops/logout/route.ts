import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();

  const url = new URL(req.url);
  const nextPath = url.searchParams.get("next")?.startsWith("/")
    ? url.searchParams.get("next")!
    : "/ops/login";
  return NextResponse.redirect(new URL(nextPath, req.url), { status: 303 });
}
