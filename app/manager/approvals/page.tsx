import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  CONTRIBUTION_ATTACHMENT_BUCKET,
  parseContributionContent,
} from "@/lib/public-submissions";
import { ApprovalsTabs } from "./ApprovalsTabs";
import "./approvals.css";

export default async function ApprovalsPage() {
  const supabase = getSupabaseAdmin();

  const [submissionsRes, mcqRes, logRes, flaggedRes, batchRes, subtemasRes, approvedRes] =
    await Promise.all([
      supabase
        .from("public_submissions")
        .select(
          "id, type, title, url, content, email, escola, status, created_at, subtema_id, instagram_handle, subtema:edu_subtemas_exame(nome)"
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("quiz_perguntas")
        .select(
          "id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, opcao_correta, explicacao, dificuldade, status, source, submitted_by_email, created_at, subtema:edu_subtemas_exame(nome)"
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("ops_notifications")
        .select("id, type, message, meta, seen, created_at")
        .in("type", [
          "public_submission",
          "teacher_mcq",
          "teacher_content",
          "teacher_flag",
        ])
        .order("created_at", { ascending: false })
        .limit(30),

      // All teacher question reviews — filter has_issue + critical_flag in JS
      supabase
        .from("ops_notifications")
        .select("id, meta, seen, created_at")
        .eq("type", "teacher_question_review")
        .order("created_at", { ascending: false })
        .limit(500),

      // Batch history
      supabase
        .from("ops_notifications")
        .select("id, meta, created_at")
        .eq("type", "teacher_review_batch")
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("edu_subtemas_exame")
        .select("id, nome, tema:edu_temas_exame(nome)")
        .order("tema_id")
        .order("ordem"),

      supabase
        .from("public_submissions")
        .select("instagram_handle")
        .eq("status", "approved")
        .not("instagram_handle", "is", null)
    ]);

  // ── Build submissions with signed attachment URLs ──────────────
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
          if (error) console.error("Failed to create signed attachment URL:", error);
          return { ...attachment, downloadUrl: data?.signedUrl ?? null };
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

  // ── Build flagged reviews (has_issue + critical_flag only) ─────
  type RawMeta = Record<string, unknown>;

  const allReviewRows = flaggedRes.data ?? [];
  const flaggedRows = allReviewRows.filter((row) => {
    const m = row.meta as RawMeta | null;
    return m?.decision === "has_issue" || m?.decision === "critical_flag";
  });

  // Fetch questions for flagged reviews
  const questionIds = [
    ...new Set(
      flaggedRows
        .map((r) => (r.meta as RawMeta)?.question_id as string | undefined)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const questionsMap = new Map<string, Record<string, unknown>>();
  if (questionIds.length > 0) {
    const { data: questions } = await supabase
      .from("quiz_perguntas")
      .select(
        "id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, opcao_correta, explicacao, dificuldade, subtema:edu_subtemas_exame(nome)"
      )
      .in("id", questionIds);
    for (const q of questions ?? []) {
      questionsMap.set(q.id, q as Record<string, unknown>);
    }
  }

  const flaggedReviews = flaggedRows.map((row) => {
    const m = row.meta as RawMeta;
    const questionId = m?.question_id as string | undefined;
    return {
      id: row.id,
      seen: row.seen as boolean | null,
      created_at: row.created_at as string | null,
      decision: m?.decision as "has_issue" | "critical_flag",
      note: (m?.note as string) || "",
      teacherEmail: (m?.teacher_email as string) || null,
      batchId: (m?.batch_id as string) || null,
      questionId: questionId ?? null,
      reviewedAt: (m?.reviewed_at as string) || (row.created_at as string) || "",
      question: questionId ? (questionsMap.get(questionId) ?? null) : null,
    };
  });

  // Sort: critical first, then unseen first, then by date
  flaggedReviews.sort((a, b) => {
    if (a.decision === "critical_flag" && b.decision !== "critical_flag") return -1;
    if (b.decision === "critical_flag" && a.decision !== "critical_flag") return 1;
    if (!a.seen && b.seen) return -1;
    if (a.seen && !b.seen) return 1;
    return (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? "");
  });

  // ── Build batch history ────────────────────────────────────────
  const batchHistory = (batchRes.data ?? []).map((row) => {
    const m = row.meta as RawMeta | null;
    return {
      id: row.id,
      created_at: row.created_at as string | null,
      batchId: (m?.batch_id as string) || row.id,
      teacherEmail: (m?.teacher_email as string) || null,
      themeName: (m?.theme_name as string) || "—",
      subtemaName: (m?.subtema_name as string) || null,
      questionCount: (m?.question_count as number) || 0,
      currentIndex: (m?.current_index as number) || 0,
      status: (m?.status as string) || "active",
      completedAt: (m?.completed_at as string) || null,
    };
  });

  const unseenFlagCount = flaggedReviews.filter((r) => !r.seen).length;
  const subtemaOptions = (subtemasRes.data ?? []).map((s) => ({
    id: s.id,
    label: `${(s.tema as unknown as { nome: string } | null)?.nome ?? "Geral"} — ${s.nome}`,
  }));

  const leaderboardMap = new Map<string, number>();
  for (const row of approvedRes.data ?? []) {
    const handle = (row.instagram_handle ?? "").trim().replace(/^@+/, "").toLowerCase();
    if (!handle) continue;
    leaderboardMap.set(handle, (leaderboardMap.get(handle) ?? 0) + 1);
  }

  const leaderboard = [...leaderboardMap.entries()]
    .map(([handle, approvedCount]) => ({ handle, approvedCount }))
    .sort((a, b) => b.approvedCount - a.approvedCount || a.handle.localeCompare(b.handle))
    .slice(0, 20);

  return (
    <div style={{ padding: 32 }}>
      <div className="page-header">
        <h1 className="page-title">Aprovações</h1>
        <p className="page-description">
          Revê e aprova sugestões do público, perguntas de professores e flags de revisão.
        </p>
      </div>

      <ApprovalsTabs
        submissions={submissions}
        subtemas={subtemaOptions}
        leaderboard={leaderboard}
        mcqs={mcqRes.data ?? []}
        log={logRes.data ?? []}
        flaggedReviews={flaggedReviews}
        batchHistory={batchHistory}
        unseenFlagCount={unseenFlagCount}
      />
    </div>
  );
}
