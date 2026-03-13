"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";
import {
  abandonActiveTeacherBatches,
  getSampledQuestionIds,
  getTeacherQuestionReviewRow,
  getTeacherReviewBatchRow,
  getTeacherReviewBatchSession,
  updateTeacherBatchMeta,
  type ReviewDecision,
} from "@/lib/teacher-review";

export async function createContent(formData: FormData): Promise<{ error: string } | never> {
  await requireTeacherUser();

  const title = (formData.get("title") as string)?.trim();
  const type = formData.get("type") as string;
  const subtemaId = formData.get("subtema_id") as string;
  const videoUrl = (formData.get("video_url") as string)?.trim();
  const markdownContent = (formData.get("markdown_content") as string)?.trim();

  if (!title || !type || !subtemaId) {
    return { error: "Por favor preenche o título, tipo e subtema." };
  }

  const supabase = getSupabaseAdmin();

  const { error: insertError } = await supabase.from("edu_content_resources").insert({
    title,
    type,
    subtema_id: parseInt(subtemaId, 10),
    video_url: videoUrl || null,
    markdown_content: markdownContent || null,
  });

  if (insertError) {
    console.error("Failed to create content:", insertError);
    return { error: "Ocorreu um erro ao guardar. Tenta novamente." };
  }

  await supabase.from("ops_notifications").insert({
    type: "teacher_content",
    message: `Novo conteúdo publicado: "${title}" (${type})`,
    meta: { title, type },
  });

  redirect("/studio/teacher/conteudo");
}

export async function createMCQ(formData: FormData): Promise<{ error: string } | never> {
  const user = await requireTeacherUser();

  const pergunta = (formData.get("pergunta") as string)?.trim();
  const opcaoA = (formData.get("opcao_a") as string)?.trim();
  const opcaoB = (formData.get("opcao_b") as string)?.trim();
  const opcaoC = (formData.get("opcao_c") as string)?.trim();
  const opcaoD = (formData.get("opcao_d") as string)?.trim();
  const opcaoCorreta = formData.get("opcao_correta") as string;
  const explicacao = (formData.get("explicacao") as string)?.trim();
  const subtemaId = formData.get("subtema_id") as string;
  const dificuldade = formData.get("dificuldade") as string;
  const email = user.email?.trim() || (formData.get("submitted_by_email") as string)?.trim();

  if (!pergunta || !opcaoA || !opcaoB || !opcaoC || !opcaoD || !opcaoCorreta || !explicacao || !subtemaId) {
    return { error: "Por favor preenche todos os campos obrigatórios." };
  }

  const supabase = getSupabaseAdmin();

  const { error: insertError } = await supabase.from("quiz_perguntas").insert({
    pergunta,
    opcao_a: opcaoA,
    opcao_b: opcaoB,
    opcao_c: opcaoC,
    opcao_d: opcaoD,
    opcao_correta: opcaoCorreta,
    explicacao,
    subtema_id: parseInt(subtemaId, 10),
    dificuldade: dificuldade || "medio",
    status: "pending",
    source: "teacher",
    submitted_by_email: email || null,
  });

  if (insertError) {
    console.error("Failed to create MCQ:", insertError);
    return { error: "Ocorreu um erro ao guardar. Tenta novamente." };
  }

  await supabase.from("ops_notifications").insert({
    type: "teacher_mcq",
    message: `Nova pergunta MCQ submetida por ${email || "professor"}`,
    meta: { pergunta: pergunta.substring(0, 100) },
  });

  revalidatePath("/studio/teacher");
  revalidatePath("/studio/teacher/progresso");
  redirect("/studio/teacher/sugestoes/nova?success=1");
}

export async function submitFlag(formData: FormData): Promise<{ error: string } | never> {
  const user = await requireTeacherUser();

  const flagType = formData.get("flag_type") as string;
  const description = (formData.get("description") as string)?.trim();
  const reference = (formData.get("reference") as string)?.trim();
  const email = user.email?.trim() || (formData.get("email") as string)?.trim();

  if (!flagType || !description) {
    return { error: "Por favor indica o tipo e a descrição do problema." };
  }

  const supabase = getSupabaseAdmin();

  const { error: insertError } = await supabase.from("ops_notifications").insert({
    type: "teacher_flag",
    message: `[${flagType}] ${description.substring(0, 200)}`,
    meta: {
      flag_type: flagType,
      description,
      reference: reference || null,
      email: email || null,
    },
  });

  if (insertError) {
    console.error("Failed to submit flag:", insertError);
    return { error: "Ocorreu um erro ao enviar. Tenta novamente." };
  }

  redirect("/studio/teacher/flags?success=1");
}

export async function startTeacherReviewBatch(formData: FormData) {
  const user = await requireTeacherUser();
  const supabase = getSupabaseAdmin();

  const themeId = Number(formData.get("theme_id"));
  const themeName = (formData.get("theme_name") as string | null)?.trim() ?? "";
  const subthemeIdValue = (formData.get("subtheme_id") as string | null)?.trim() ?? "";
  const subthemeName = (formData.get("subtheme_name") as string | null)?.trim() ?? "";
  const subthemeId = subthemeIdValue ? Number(subthemeIdValue) : null;

  if (!Number.isFinite(themeId) || !themeName) {
    redirect("/studio/teacher/revisao?error=Seleciona%20um%20tema%20para%20come%C3%A7ar.");
  }

  const questionIds = await getSampledQuestionIds(themeId, Number.isFinite(subthemeId) ? subthemeId : null, user.id, 20);

  if (!questionIds.length) {
    redirect("/studio/teacher/revisao?error=N%C3%A3o%20existem%20perguntas%20suficientes%20para%20essa%20sele%C3%A7%C3%A3o.");
  }

  await abandonActiveTeacherBatches(user.id);

  const batchId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ops_notifications")
    .insert({
      type: "teacher_review_batch",
      message: `batch:${batchId}:${user.id}`,
      meta: {
        batch_id: batchId,
        teacher_user_id: user.id,
        teacher_email: user.email ?? null,
        theme_id: themeId,
        theme_name: themeName,
        subtema_id: Number.isFinite(subthemeId) ? subthemeId : null,
        subtema_name: subthemeName || null,
        question_ids: questionIds,
        question_count: questionIds.length,
        current_index: 0,
        status: "active",
        started_at: now,
        completed_at: null,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create teacher review batch:", error);
    redirect("/studio/teacher/revisao?error=N%C3%A3o%20foi%20poss%C3%ADvel%20criar%20a%20sess%C3%A3o%20de%20revis%C3%A3o.");
  }

  revalidatePath("/studio/teacher");
  revalidatePath("/studio/teacher/revisao");
  revalidatePath("/studio/teacher/progresso");
  redirect(`/studio/teacher/revisao/${batchId}`);
}

export async function submitTeacherQuestionReview(formData: FormData) {
  const user = await requireTeacherUser();
  const supabase = getSupabaseAdmin();

  const batchId = (formData.get("batch_id") as string | null)?.trim() ?? "";
  const questionId = Number(formData.get("question_id"));
  const decision = formData.get("decision");
  const note = (formData.get("note") as string | null)?.trim() ?? "";

  if (!batchId || !Number.isFinite(questionId)) {
    redirect("/studio/teacher/revisao?error=Faltam%20dados%20da%20sess%C3%A3o%20de%20revis%C3%A3o.");
  }

  if (
    decision !== "approved" &&
    decision !== "has_issue" &&
    decision !== "critical_flag" &&
    decision !== "skipped"
  ) {
    redirect(`/studio/teacher/revisao/${batchId}?error=Escolhe%20uma%20decis%C3%A3o%20v%C3%A1lida.`);
  }

  const batchRow = await getTeacherReviewBatchRow(batchId, user.id);

  if (!batchRow) {
    redirect("/studio/teacher/revisao?error=Sess%C3%A3o%20de%20revis%C3%A3o%20n%C3%A3o%20encontrada.");
  }

  const existingReview = await getTeacherQuestionReviewRow(batchId, questionId, user.id);
  const reviewPayload = {
    type: "teacher_question_review",
    message: `review:${batchId}:${questionId}:${user.id}`,
    meta: {
      batch_id: batchId,
      question_id: questionId,
      decision: decision as ReviewDecision,
      note,
      teacher_user_id: user.id,
      teacher_email: user.email ?? null,
      reviewed_at: new Date().toISOString(),
    },
  };

  if (existingReview) {
    const { error } = await supabase
      .from("ops_notifications")
      .update(reviewPayload)
      .eq("id", existingReview.id);

    if (error) {
      console.error("Failed to update teacher review decision:", error);
      redirect(`/studio/teacher/revisao/${batchId}?error=N%C3%A3o%20foi%20poss%C3%ADvel%20guardar%20a%20decis%C3%A3o.`);
    }
  } else {
    const { error } = await supabase.from("ops_notifications").insert(reviewPayload);

    if (error) {
      console.error("Failed to create teacher review decision:", error);
      redirect(`/studio/teacher/revisao/${batchId}?error=N%C3%A3o%20foi%20poss%C3%ADvel%20guardar%20a%20decis%C3%A3o.`);
    }
  }

  const session = await getTeacherReviewBatchSession(user.id, batchId);

  if (session) {
    const completed = session.questions.length > 0 && session.decisions.size >= session.questions.length;
    await updateTeacherBatchMeta(batchRow.id, {
      batch_id: batchId,
      teacher_user_id: user.id,
      teacher_email: user.email ?? null,
      theme_id: session.batch.themeId,
      theme_name: session.batch.themeName,
      subtema_id: session.batch.subtemaId,
      subtema_name: session.batch.subtemaName,
      question_ids: session.batch.questionIds,
      question_count: session.batch.questionCount,
      current_index: completed ? session.batch.questionCount : session.currentIndex,
      status: completed ? "completed" : "active",
      started_at: session.batch.createdAt,
      completed_at: completed ? new Date().toISOString() : null,
    });
  }

  revalidatePath("/studio/teacher");
  revalidatePath("/studio/teacher/revisao");
  revalidatePath(`/studio/teacher/revisao/${batchId}`);
  revalidatePath("/studio/teacher/progresso");

  redirect(`/studio/teacher/revisao/${batchId}`);
}
