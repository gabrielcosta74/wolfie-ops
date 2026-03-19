"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireManagerUser } from "@/lib/ops-auth";
import { requireTrustedOriginForAction } from "@/lib/request-security";
import { revalidatePath } from "next/cache";

export async function updateExamQuestion(
  id: string,
  data: {
    question_text: string;
    opcao_a?: string;
    opcao_b?: string;
    opcao_c?: string;
    opcao_d?: string;
    opcao_correta?: string;
    cotacao: number;
    difficulty_level: string;
    is_optional: boolean;
    question_type: string;
  }
) {
  await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("exame_nacional_questions")
    .update({
      question_text: data.question_text,
      opcao_a: data.opcao_a || null,
      opcao_b: data.opcao_b || null,
      opcao_c: data.opcao_c || null,
      opcao_d: data.opcao_d || null,
      opcao_correta: data.opcao_correta || null,
      cotacao: data.cotacao,
      difficulty_level: data.difficulty_level,
      is_optional: data.is_optional,
      question_type: data.question_type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/manager/exams");
  return { success: true };
}
