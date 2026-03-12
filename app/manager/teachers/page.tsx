import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TeacherAccessManager } from "./TeacherAccessManager";

export const dynamic = "force-dynamic";

export default async function TeacherManagementPage() {
  const supabase = getSupabaseAdmin();

  const [{ data: profiles }, usersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, name, role, created_at")
      .eq("role", "teacher")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    }),
  ]);

  const authUsers = usersRes.data?.users ?? [];
  const userMap = new Map(authUsers.map((user) => [user.id, user]));

  const teachers = (profiles ?? []).map((profile) => {
    const authUser = userMap.get(profile.user_id);

    return {
      id: profile.user_id,
      email: authUser?.email ?? "",
      name:
        profile.name ||
        (typeof authUser?.user_metadata?.name === "string"
          ? authUser.user_metadata.name
          : ""),
      createdAt: authUser?.created_at ?? profile.created_at,
    };
  });

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Professores
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--muted)" }}>
          Cria logins de professor e gere o acesso ao Wolfie Studio.
        </p>
      </header>

      <TeacherAccessManager teachers={teachers} />
    </div>
  );
}
