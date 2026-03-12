import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseServer } from "@/lib/supabase-server";

export type StudioSession = {
  user: {
    id: string;
    email?: string;
  } | null;
  role: string | null;
};

export async function getStudioSession(): Promise<StudioSession> {
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
    console.error("Failed to load studio profile:", error);
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

export async function requireTeacherUser() {
  const session = await getStudioSession();

  if (!session.user) {
    redirect("/studio/login");
  }

  if (session.role !== "teacher") {
    redirect("/studio/unauthorized");
  }

  return session.user;
}
