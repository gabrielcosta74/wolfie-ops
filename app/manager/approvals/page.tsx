import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ApprovalsTabs } from "./ApprovalsTabs";
import "./approvals.css";

export default async function ApprovalsPage() {
  const supabase = getSupabaseAdmin();

  const [submissionsRes, mcqRes, logRes] = await Promise.all([
    supabase
      .from("public_submissions")
      .select("id, type, title, url, content, email, escola, status, created_at, subtema:edu_subtemas_exame(nome)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("quiz_perguntas")
      .select("id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, opcao_correta, explicacao, dificuldade, status, source, submitted_by_email, created_at, subtema:edu_subtemas_exame(nome)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("ops_notifications")
      .select("id, type, message, meta, seen, created_at")
      .in("type", ["public_submission", "teacher_mcq", "teacher_content", "teacher_flag"])
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header">
        <h1 className="page-title">Aprovações</h1>
        <p className="page-description">Revê e aprova sugestões do público e perguntas de professores.</p>
      </div>

      <ApprovalsTabs
        submissions={submissionsRes.data ?? []}
        mcqs={mcqRes.data ?? []}
        log={logRes.data ?? []}
      />
    </div>
  );
}
