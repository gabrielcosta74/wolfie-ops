import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect("/studio/login");
}
