import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  CONTRIBUTION_ATTACHMENT_BUCKET,
  parseContributionContent,
} from "@/lib/public-submissions";
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

  const submissions = await Promise.all(
    (submissionsRes.data ?? []).map(async (submission) => {
      const parsed = parseContributionContent(submission.content);
      const attachments = await Promise.all(
        (parsed.meta.attachments ?? []).map(async (attachment) => {
          const { data, error } = await supabase.storage
            .from(CONTRIBUTION_ATTACHMENT_BUCKET)
            .createSignedUrl(attachment.path, 60 * 60 * 24 * 7, {
              download: attachment.name,
            });

          if (error) {
            console.error("Failed to create signed attachment URL:", error);
          }

          return {
            ...attachment,
            downloadUrl: data?.signedUrl ?? null,
          };
        })
      );

      return {
        ...submission,
        attachments,
        content: parsed.description || null,
        source_name: parsed.meta.sourceName ?? null,
        suggestion: parsed.meta.suggestion ?? null,
      };
    })
  );

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header">
        <h1 className="page-title">Aprovações</h1>
        <p className="page-description">Revê e aprova sugestões do público e perguntas de professores.</p>
      </div>

      <ApprovalsTabs
        submissions={submissions}
        mcqs={mcqRes.data ?? []}
        log={logRes.data ?? []}
      />
    </div>
  );
}
