"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function approveSubmission(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("public_submissions")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) {
    console.error("Failed to approve submission:", error);
    return { error: "Falha ao aprovar." };
  }

  revalidatePath("/manager/approvals");
  return { success: true };
}

export async function rejectSubmission(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("public_submissions")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    console.error("Failed to reject submission:", error);
    return { error: "Falha ao rejeitar." };
  }

  revalidatePath("/manager/approvals");
  return { success: true };
}

export async function approveMCQ(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("quiz_perguntas")
    .update({ status: "live" })
    .eq("id", id);

  if (error) {
    console.error("Failed to approve MCQ:", error);
    return { error: "Falha ao aprovar." };
  }

  revalidatePath("/manager/approvals");
  return { success: true };
}

export async function rejectMCQ(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("quiz_perguntas")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    console.error("Failed to reject MCQ:", error);
    return { error: "Falha ao rejeitar." };
  }

  revalidatePath("/manager/approvals");
  return { success: true };
}
