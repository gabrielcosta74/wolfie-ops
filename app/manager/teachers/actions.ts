"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { TeacherActionState } from "./state";

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function findUserByEmail(email: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
}

async function ensureTeacherProfile(userId: string, name?: string) {
  const supabase = getSupabaseAdmin();
  const payload: { user_id: string; role: string; name?: string } = {
    user_id: userId,
    role: "teacher",
  };

  if (name) {
    payload.name = name;
  }

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    throw error;
  }
}

export async function createTeacher(
  _prevState: TeacherActionState,
  formData: FormData
): Promise<TeacherActionState> {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizeText(formData.get("password"));
  const name = normalizeText(formData.get("name"));

  if (!email || !password) {
    return { status: "error", message: "Email e password são obrigatórios." };
  }

  if (password.length < 8) {
    return { status: "error", message: "A password deve ter pelo menos 8 caracteres." };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : undefined,
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: error?.message ?? "Não foi possível criar o professor.",
    };
  }

  try {
    await ensureTeacherProfile(data.user.id, name || undefined);
  } catch (profileError) {
    console.error("Failed to ensure teacher profile after createUser:", profileError);
    return {
      status: "error",
      message: "Conta criada, mas falhou a atribuição do role teacher.",
    };
  }

  revalidatePath("/manager/teachers");

  return {
    status: "success",
    message: `Professor criado com sucesso para ${email}.`,
  };
}

export async function promoteTeacher(
  _prevState: TeacherActionState,
  formData: FormData
): Promise<TeacherActionState> {
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    return { status: "error", message: "Indica o email da conta existente." };
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return {
        status: "error",
        message: "Conta não encontrada. Cria o professor primeiro.",
      };
    }

    await ensureTeacherProfile(
      user.id,
      typeof user.user_metadata?.name === "string" ? user.user_metadata.name : undefined
    );
  } catch (error) {
    console.error("Failed to promote teacher:", error);
    return {
      status: "error",
      message: "Não foi possível promover a conta para professor.",
    };
  }

  revalidatePath("/manager/teachers");

  return {
    status: "success",
    message: `Role teacher atribuído a ${email}.`,
  };
}
