"use server";

import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface SubmissionInput {
  type: string;
  title: string;
  subtema_id: string;
  url: string;
  content: string;
  email: string;
  escola: string;
}

export async function submitContribution(formData: FormData): Promise<{ error: string } | never> {
  const input: SubmissionInput = {
    type: formData.get("type") as string,
    title: formData.get("title") as string,
    subtema_id: formData.get("subtema_id") as string,
    url: formData.get("url") as string,
    content: formData.get("content") as string,
    email: formData.get("email") as string,
    escola: formData.get("escola") as string,
  };

  // --- Validation ---
  if (!input.type || !input.title) {
    return { error: "Por favor preenche o tipo e o título." };
  }

  if (!input.url && !input.content) {
    return { error: "Por favor indica um URL ou descreve o conteúdo." };
  }

  const supabase = getSupabaseAdmin();

  // --- Insert submission ---
  const subtemaId = input.subtema_id ? parseInt(input.subtema_id, 10) : null;

  const { error: insertError } = await supabase.from("public_submissions").insert({
    type: input.type,
    title: input.title.trim(),
    subtema_id: subtemaId,
    url: input.url.trim() || null,
    content: input.content.trim() || null,
    email: input.email.trim() || null,
    escola: input.escola.trim() || null,
    status: "pending",
  });

  if (insertError) {
    console.error("Failed to insert submission:", insertError);
    return { error: "Ocorreu um erro ao enviar. Tenta novamente." };
  }

  // --- Notify ops ---
  await supabase.from("ops_notifications").insert({
    type: "public_submission",
    message: `Nova sugestão: "${input.title.trim()}" (${input.type})`,
    meta: {
      submission_type: input.type,
      title: input.title.trim(),
      email: input.email.trim() || null,
    },
  });

  redirect("/contribuir/obrigado");
}
