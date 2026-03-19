import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseServer } from "@/lib/supabase-server";

export type OpsSession = {
  user: {
    id: string;
    email?: string;
  } | null;
  role: string | null;
};

const MANAGER_ROLES = new Set(["admin"]);

export function isManagerRole(role: string | null | undefined) {
  return Boolean(role && MANAGER_ROLES.has(role));
}

export async function getOpsSession(): Promise<OpsSession> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: null };
  }

  const admin = getSupabaseAdmin();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load ops profile:", error);
    return {
      user: {
        id: user.id,
        email: user.email,
      },
      role: null,
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    role: profile?.role ?? null,
  };
}

export async function requireManagerUser() {
  const session = await getOpsSession();

  if (!session.user) {
    redirect("/ops/login");
  }

  if (!isManagerRole(session.role)) {
    redirect("/ops/unauthorized");
  }

  return session.user;
}

export async function requireManagerApiUser() {
  const session = await getOpsSession();

  if (!session.user) {
    return NextResponse.json(
      { ok: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  if (!isManagerRole(session.role)) {
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  return session.user;
}
