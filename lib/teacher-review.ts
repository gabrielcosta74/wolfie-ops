import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type ReviewDecision = "approved" | "has_issue" | "critical_flag" | "skipped";
export type ReviewBatchStatus = "active" | "completed" | "abandoned";

export type ReviewThemeOption = {
  id: number;
  name: string;
};

export type ReviewSubthemeOption = {
  id: number;
  name: string;
  themeId: number;
  themeName: string;
};

export type ReviewQuestion = {
  id: number;
  subtemaId: number | null;
  pergunta: string;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  opcaoCorreta: string;
  explicacao: string;
  dificuldade: string | null;
  taxaAcerto: number | null;
  numTentativas: number | null;
  source: string | null;
  status: string | null;
  subtemaName: string | null;
  themeId: number | null;
  themeName: string | null;
};

export type ReviewDecisionRecord = {
  questionId: number;
  decision: ReviewDecision;
  note: string;
  createdAt: string;
};

export type ReviewBatchSummary = {
  notificationId: number;
  batchId: string;
  status: ReviewBatchStatus;
  themeId: number;
  themeName: string;
  subtemaId: number | null;
  subtemaName: string | null;
  questionIds: number[];
  questionCount: number;
  currentIndex: number;
  createdAt: string;
  completedAt: string | null;
  reviewedCount: number;
  decisionCounts: Record<ReviewDecision, number>;
};

export type ReviewDashboardData = {
  activeBatch: ReviewBatchSummary | null;
  recentBatches: ReviewBatchSummary[];
  totalReviewed: number;
  totalIssues: number;
  totalCriticalFlags: number;
  totalSuggestions: number;
  completedBatches: number;
};

export type ReviewBatchSession = {
  batch: ReviewBatchSummary;
  questions: ReviewQuestion[];
  decisions: Map<number, ReviewDecisionRecord>;
  currentQuestion: ReviewQuestion | null;
  currentIndex: number;
  isCompleted: boolean;
};

type BatchMeta = {
  batch_id: string;
  teacher_user_id: string;
  teacher_email: string | null;
  theme_id: number;
  theme_name: string;
  subtema_id: number | null;
  subtema_name: string | null;
  question_ids: number[];
  question_count: number;
  current_index: number;
  status: ReviewBatchStatus;
  started_at: string;
  completed_at: string | null;
};

type ReviewMeta = {
  batch_id: string;
  question_id: number;
  decision: ReviewDecision;
  note: string;
  teacher_user_id: string;
  teacher_email: string | null;
  reviewed_at: string;
};

type NotificationRow = {
  id: number;
  type: string;
  message: string;
  meta: unknown;
  created_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseDecision(value: unknown): ReviewDecision | null {
  return value === "approved" ||
    value === "has_issue" ||
    value === "critical_flag" ||
    value === "skipped"
    ? value
    : null;
}

function parseBatchStatus(value: unknown): ReviewBatchStatus {
  return value === "completed" || value === "abandoned" ? value : "active";
}

function parseNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(asNumber).filter((item): item is number => item !== null);
}

function shuffle<T>(items: T[]): T[] {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[target]] = [clone[target], clone[index]];
  }
  return clone;
}

function createVariedOrder(questions: ReviewQuestion[], limit: number) {
  const buckets = new Map<string, ReviewQuestion[]>();

  for (const question of shuffle(questions)) {
    const bucketKey = `${question.themeId ?? "na"}:${question.subtemaId ?? "na"}:${question.dificuldade ?? "na"}:${question.source ?? "na"}`;
    const bucket = buckets.get(bucketKey) ?? [];
    bucket.push(question);
    buckets.set(bucketKey, bucket);
  }

  const orderedBuckets = shuffle(Array.from(buckets.values()));
  const picked: ReviewQuestion[] = [];

  while (orderedBuckets.some((bucket) => bucket.length > 0) && picked.length < limit) {
    for (const bucket of orderedBuckets) {
      const question = bucket.shift();
      if (!question) continue;
      picked.push(question);
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

function batchMessage(batchId: string, userId: string) {
  return `batch:${batchId}:${userId}`;
}

function reviewMessage(batchId: string, questionId: number, userId: string) {
  return `review:${batchId}:${questionId}:${userId}`;
}

function parseBatchMeta(meta: unknown): BatchMeta | null {
  if (!isRecord(meta)) return null;

  const batchId = asString(meta.batch_id);
  const teacherUserId = asString(meta.teacher_user_id);
  const themeId = asNumber(meta.theme_id);
  const themeName = asString(meta.theme_name);
  const questionIds = parseNumberArray(meta.question_ids);
  const questionCount = asNumber(meta.question_count) ?? questionIds.length;

  if (!batchId || !teacherUserId || themeId === null || !themeName || questionIds.length === 0) {
    return null;
  }

  return {
    batch_id: batchId,
    teacher_user_id: teacherUserId,
    teacher_email: asString(meta.teacher_email),
    theme_id: themeId,
    theme_name: themeName,
    subtema_id: asNumber(meta.subtema_id),
    subtema_name: asString(meta.subtema_name),
    question_ids: questionIds,
    question_count: questionCount,
    current_index: asNumber(meta.current_index) ?? 0,
    status: parseBatchStatus(meta.status),
    started_at: asString(meta.started_at) ?? new Date().toISOString(),
    completed_at: asString(meta.completed_at),
  };
}

function parseReviewMeta(meta: unknown): ReviewMeta | null {
  if (!isRecord(meta)) return null;

  const batchId = asString(meta.batch_id);
  const questionId = asNumber(meta.question_id);
  const decision = parseDecision(meta.decision);
  const teacherUserId = asString(meta.teacher_user_id);

  if (!batchId || questionId === null || !decision || !teacherUserId) {
    return null;
  }

  return {
    batch_id: batchId,
    question_id: questionId,
    decision,
    note: asString(meta.note) ?? "",
    teacher_user_id: teacherUserId,
    teacher_email: asString(meta.teacher_email),
    reviewed_at: asString(meta.reviewed_at) ?? new Date().toISOString(),
  };
}

async function listTeacherBatchRows(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ops_notifications")
    .select("id, type, message, meta, created_at")
    .eq("type", "teacher_review_batch")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Failed to load teacher review batches:", error);
    return [] as Array<{ row: NotificationRow; meta: BatchMeta }>;
  }

  return (data ?? [])
    .map((row) => ({ row: row as NotificationRow, meta: parseBatchMeta(row.meta) }))
    .filter((entry): entry is { row: NotificationRow; meta: BatchMeta } => Boolean(entry.meta))
    .filter((entry) => entry.meta.teacher_user_id === userId);
}

async function listTeacherReviewRows(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ops_notifications")
    .select("id, type, message, meta, created_at")
    .eq("type", "teacher_question_review")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("Failed to load teacher review decisions:", error);
    return [] as Array<{ row: NotificationRow; meta: ReviewMeta }>;
  }

  return (data ?? [])
    .map((row) => ({ row: row as NotificationRow, meta: parseReviewMeta(row.meta) }))
    .filter((entry): entry is { row: NotificationRow; meta: ReviewMeta } => Boolean(entry.meta))
    .filter((entry) => entry.meta.teacher_user_id === userId);
}

function summarizeBatches(
  batches: Array<{ row: NotificationRow; meta: BatchMeta }>,
  reviews: Array<{ row: NotificationRow; meta: ReviewMeta }>
) {
  const reviewsByBatch = new Map<string, Map<number, ReviewDecisionRecord>>();

  for (const review of reviews) {
    const batchReviews = reviewsByBatch.get(review.meta.batch_id) ?? new Map<number, ReviewDecisionRecord>();
    batchReviews.set(review.meta.question_id, {
      questionId: review.meta.question_id,
      decision: review.meta.decision,
      note: review.meta.note,
      createdAt: review.row.created_at,
    });
    reviewsByBatch.set(review.meta.batch_id, batchReviews);
  }

  return batches.map(({ row, meta }) => {
    const batchReviews = reviewsByBatch.get(meta.batch_id) ?? new Map<number, ReviewDecisionRecord>();
    const decisionCounts: Record<ReviewDecision, number> = {
      approved: 0,
      has_issue: 0,
      critical_flag: 0,
      skipped: 0,
    };

    batchReviews.forEach((review) => {
      decisionCounts[review.decision] += 1;
    });

    return {
      notificationId: row.id,
      batchId: meta.batch_id,
      status: meta.status,
      themeId: meta.theme_id,
      themeName: meta.theme_name,
      subtemaId: meta.subtema_id,
      subtemaName: meta.subtema_name,
      questionIds: meta.question_ids,
      questionCount: meta.question_count,
      currentIndex: meta.current_index,
      createdAt: row.created_at,
      completedAt: meta.completed_at,
      reviewedCount: batchReviews.size,
      decisionCounts,
    } satisfies ReviewBatchSummary;
  });
}

export async function getTeacherReviewSetup() {
  const supabase = getSupabaseAdmin();
  const [themesRes, subthemesRes] = await Promise.all([
    supabase.from("edu_temas_exame").select("id, nome").order("nome"),
    supabase
      .from("edu_subtemas_exame")
      .select("id, nome, tema_id, tema:edu_temas_exame(id, nome)")
      .order("nome"),
  ]);

  const themes = (themesRes.data ?? []).map((theme) => ({
    id: theme.id,
    name: theme.nome,
  })) satisfies ReviewThemeOption[];

  const subthemes = (subthemesRes.data ?? []).flatMap((subtheme) => {
    const theme = subtheme.tema as unknown as { id?: number; nome?: string } | null;
    if (!theme?.id || !theme.nome) return [];

    return [
      {
        id: subtheme.id,
        name: subtheme.nome,
        themeId: theme.id,
        themeName: theme.nome,
      } satisfies ReviewSubthemeOption,
    ];
  });

  return { themes, subthemes };
}

export async function getTeacherReviewDashboard(userId: string, userEmail?: string | null) {
  const [batches, reviews, suggestionCountRes] = await Promise.all([
    listTeacherBatchRows(userId),
    listTeacherReviewRows(userId),
    getSupabaseAdmin()
      .from("quiz_perguntas")
      .select("id", { count: "exact", head: true })
      .eq("source", "teacher")
      .eq("submitted_by_email", userEmail ?? ""),
  ]);

  const batchSummaries = summarizeBatches(batches, reviews);
  const activeBatch = batchSummaries.find((batch) => batch.status === "active") ?? null;

  return {
    activeBatch,
    recentBatches: batchSummaries.slice(0, 6),
    totalReviewed: reviews.length,
    totalIssues: reviews.filter((review) => review.meta.decision === "has_issue").length,
    totalCriticalFlags: reviews.filter((review) => review.meta.decision === "critical_flag").length,
    totalSuggestions: suggestionCountRes.count ?? 0,
    completedBatches: batchSummaries.filter((batch) => batch.status === "completed").length,
  } satisfies ReviewDashboardData;
}

export async function getTeacherReviewBatchSession(userId: string, batchId: string) {
  const [batches, reviews] = await Promise.all([listTeacherBatchRows(userId), listTeacherReviewRows(userId)]);
  const batchSummary = summarizeBatches(batches, reviews).find((batch) => batch.batchId === batchId) ?? null;

  if (!batchSummary) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("quiz_perguntas")
    .select(
      "id, subtema_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, opcao_correta, explicacao, dificuldade, taxa_acerto, num_tentativas, source, status, subtema:edu_subtemas_exame(id, nome, tema_id, tema:edu_temas_exame(id, nome))"
    )
    .in("id", batchSummary.questionIds);

  if (error) {
    console.error("Failed to load review batch questions:", error);
    return null;
  }

  const questionsById = new Map<number, ReviewQuestion>();

  for (const row of data ?? []) {
    const subtema = row.subtema as unknown as
      | { id?: number; nome?: string; tema_id?: number; tema?: { id?: number; nome?: string } | null }
      | null;

    questionsById.set(row.id, {
      id: row.id,
      subtemaId: row.subtema_id ?? null,
      pergunta: row.pergunta,
      opcaoA: row.opcao_a,
      opcaoB: row.opcao_b,
      opcaoC: row.opcao_c,
      opcaoD: row.opcao_d,
      opcaoCorreta: row.opcao_correta,
      explicacao: row.explicacao,
      dificuldade: row.dificuldade,
      taxaAcerto: row.taxa_acerto ?? null,
      numTentativas: row.num_tentativas ?? null,
      source: row.source ?? null,
      status: row.status ?? null,
      subtemaName: subtema?.nome ?? null,
      themeId: subtema?.tema?.id ?? subtema?.tema_id ?? null,
      themeName: subtema?.tema?.nome ?? null,
    });
  }

  const questions = batchSummary.questionIds
    .map((questionId) => questionsById.get(questionId))
    .filter((question): question is ReviewQuestion => Boolean(question));

  const decisions = new Map<number, ReviewDecisionRecord>();

  for (const review of reviews) {
    if (review.meta.batch_id !== batchId) continue;
    decisions.set(review.meta.question_id, {
      questionId: review.meta.question_id,
      decision: review.meta.decision,
      note: review.meta.note,
      createdAt: review.row.created_at,
    });
  }

  const currentIndex = questions.findIndex((question) => !decisions.has(question.id));
  const resolvedIndex = currentIndex === -1 ? Math.max(questions.length - 1, 0) : currentIndex;

  return {
    batch: batchSummary,
    questions,
    decisions,
    currentQuestion: questions[resolvedIndex] ?? null,
    currentIndex: resolvedIndex,
    isCompleted: currentIndex === -1 && questions.length > 0,
  } satisfies ReviewBatchSession;
}

export async function getSampledQuestionIds(
  themeId: number,
  subthemeId: number | null,
  userId: string,
  limit = 20
) {
  const supabase = getSupabaseAdmin();
  let eligibleSubthemeIds: number[] = [];

  if (subthemeId) {
    eligibleSubthemeIds = [subthemeId];
  } else {
    const { data: subthemes, error: subthemesError } = await supabase
      .from("edu_subtemas_exame")
      .select("id")
      .eq("tema_id", themeId);

    if (subthemesError) {
      console.error("Failed to load subthemes for review sample:", subthemesError);
      return [];
    }

    eligibleSubthemeIds = (subthemes ?? []).map((item) => item.id);
  }

  if (!eligibleSubthemeIds.length) return [];

  const [questionsRes, reviews] = await Promise.all([
    supabase
      .from("quiz_perguntas")
      .select(
        "id, subtema_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, opcao_correta, explicacao, dificuldade, taxa_acerto, num_tentativas, source, status, subtema:edu_subtemas_exame(id, nome, tema_id, tema:edu_temas_exame(id, nome))"
      )
      .in("subtema_id", eligibleSubthemeIds)
      .limit(400),
    listTeacherReviewRows(userId),
  ]);

  if (questionsRes.error) {
    console.error("Failed to load questions for review sample:", questionsRes.error);
    return [];
  }

  const previouslyReviewedIds = new Set(reviews.map((review) => review.meta.question_id));
  const allQuestions = (questionsRes.data ?? []).map((row) => {
    const subtema = row.subtema as unknown as
      | { id?: number; nome?: string; tema_id?: number; tema?: { id?: number; nome?: string } | null }
      | null;

    return {
      id: row.id,
      subtemaId: row.subtema_id ?? null,
      pergunta: row.pergunta,
      opcaoA: row.opcao_a,
      opcaoB: row.opcao_b,
      opcaoC: row.opcao_c,
      opcaoD: row.opcao_d,
      opcaoCorreta: row.opcao_correta,
      explicacao: row.explicacao,
      dificuldade: row.dificuldade,
      taxaAcerto: row.taxa_acerto ?? null,
      numTentativas: row.num_tentativas ?? null,
      source: row.source ?? null,
      status: row.status ?? null,
      subtemaName: subtema?.nome ?? null,
      themeId: subtema?.tema?.id ?? subtema?.tema_id ?? null,
      themeName: subtema?.tema?.nome ?? null,
    } satisfies ReviewQuestion;
  });

  const unseenQuestions = allQuestions.filter((question) => !previouslyReviewedIds.has(question.id));
  const primaryPool = unseenQuestions.length >= limit ? unseenQuestions : allQuestions;
  const sample = createVariedOrder(primaryPool, limit);

  return sample.map((question) => question.id);
}

export async function updateTeacherBatchMeta(notificationId: number, meta: BatchMeta) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("ops_notifications")
    .update({ meta })
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to update teacher review batch:", error);
  }
}

export async function abandonActiveTeacherBatches(userId: string) {
  const batches = await listTeacherBatchRows(userId);

  await Promise.all(
    batches
      .filter((batch) => batch.meta.status === "active")
      .map((batch) =>
        updateTeacherBatchMeta(batch.row.id, {
          ...batch.meta,
          status: "abandoned",
        })
      )
  );
}

export async function getTeacherQuestionReviewRow(batchId: string, questionId: number, userId: string) {
  const supabase = getSupabaseAdmin();
  const message = reviewMessage(batchId, questionId, userId);
  const { data, error } = await supabase
    .from("ops_notifications")
    .select("id, type, message, meta, created_at")
    .eq("type", "teacher_question_review")
    .eq("message", message)
    .maybeSingle();

  if (error) {
    console.error("Failed to load teacher question review row:", error);
    return null;
  }

  return data as NotificationRow | null;
}

export async function getTeacherReviewBatchRow(batchId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ops_notifications")
    .select("id, type, message, meta, created_at")
    .eq("type", "teacher_review_batch")
    .eq("message", batchMessage(batchId, userId))
    .maybeSingle();

  if (error) {
    console.error("Failed to load teacher review batch row:", error);
    return null;
  }

  return data as NotificationRow | null;
}
