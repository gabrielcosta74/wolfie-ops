"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function updateQuestion(id: string, data: any) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("quiz_perguntas")
    .update(data)
    .eq("id", id);

  if (error) {
    console.error("Error updating question:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/manager/content/questions");
  return { success: true };
}
