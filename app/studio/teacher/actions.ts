"use server";

import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireTeacherUser } from "@/lib/studio-auth";

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

  redirect("/studio/teacher/perguntas");
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
