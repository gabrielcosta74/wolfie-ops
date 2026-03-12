import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";

export default async function TeacherDashboard() {
  const user = await requireTeacherUser();

  const admin = getSupabaseAdmin();

  // Fetch stats in parallel
  const [contentRes, pendingMcqRes, flagsRes] = await Promise.all([
    admin.from("edu_content_resources").select("id", { count: "exact", head: true }),
    admin.from("quiz_perguntas").select("id", { count: "exact", head: true }).eq("status", "pending").eq("source", "teacher"),
    admin.from("ops_notifications").select("id", { count: "exact", head: true }).eq("type", "teacher_flag"),
  ]);

  const contentCount = contentRes.count ?? 0;
  const pendingMcqCount = pendingMcqRes.count ?? 0;
  const flagsCount = flagsRes.count ?? 0;

  return (
    <>
      <div className="st-page-header">
        <div>
          <h1 className="st-page-title">Dashboard</h1>
          <p className="st-page-subtitle">Bem-vindo, {user.email}</p>
        </div>
      </div>

      <div className="st-stat-grid">
        <Link href="/studio/teacher/conteudo" className="st-stat-card">
          <span className="st-stat-value">{contentCount}</span>
          <span className="st-stat-label">📚 Conteúdos publicados</span>
        </Link>

        <Link href="/studio/teacher/perguntas" className="st-stat-card">
          <span className="st-stat-value">{pendingMcqCount}</span>
          <span className="st-stat-label">❓ MCQs pendentes</span>
        </Link>

        <Link href="/studio/teacher/flags" className="st-stat-card">
          <span className="st-stat-value">{flagsCount}</span>
          <span className="st-stat-label">🚩 Flags enviadas</span>
        </Link>
      </div>

      <div className="st-stat-grid">
        <Link href="/studio/teacher/conteudo/novo" className="st-btn st-btn--primary">
          + Novo conteúdo
        </Link>
        <Link href="/studio/teacher/perguntas/nova" className="st-btn st-btn--secondary">
          + Nova pergunta MCQ
        </Link>
      </div>
    </>
  );
}
