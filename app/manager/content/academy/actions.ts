"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagerUser } from "@/lib/ops-auth";
import { requireTrustedOriginForAction } from "@/lib/request-security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function asText(v: FormDataEntryValue | null): string {
  if (typeof v !== "string") return "";
  return v.trim();
}

function asNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

function extractYoutubeId(url: string): string | null {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function revalidateAll() {
  revalidatePath("/manager/content/academy", "layout");
  revalidatePath("/manager/content/academy/resumos", "layout");
  revalidatePath("/manager/content/academy/videos", "layout");
  revalidatePath("/manager/content/academy/ficheiros", "layout");
  revalidatePath("/manager/content/academy/links", "layout");
}

export async function saveResource(
  formData: FormData
): Promise<{ success: boolean; error?: string; id?: number }> {
  await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();

  const id = asText(formData.get("id"));
  const subtemaId = asNumber(formData.get("subtema_id"));
  const type = asText(formData.get("type"));
  const title = asText(formData.get("title"));
  const authorCredit = asText(formData.get("author_credit")) || null;
  const isPremium = asBoolean(formData.get("is_premium"));

  if (!subtemaId) {
    return { success: false, error: "Subtópico é obrigatório." };
  }
  if (!title) {
    return { success: false, error: "Título é obrigatório." };
  }
  if (!["summary", "video", "file", "link"].includes(type)) {
    return { success: false, error: "Tipo de conteúdo inválido." };
  }

  let payload: Record<string, unknown> = {
    subtema_id: subtemaId,
    title,
    type,
    author_credit: authorCredit,
    is_premium: isPremium,
    video_url: null,
    video_id: null,
    video_provider: null,
    video_start_at: 0,
    markdown_content: null,
  };

  if (type === "summary") {
    const markdownContent = asText(formData.get("markdown_content"));
    if (!markdownContent) {
      return { success: false, error: "Conteúdo do resumo é obrigatório." };
    }
    payload = { ...payload, markdown_content: markdownContent };
  } else if (type === "video") {
    const videoUrl = asText(formData.get("video_url"));
    if (!videoUrl) {
      return { success: false, error: "URL do vídeo é obrigatória." };
    }
    const videoStartAt = asNumber(formData.get("video_start_at")) ?? 0;
    const videoId = extractYoutubeId(videoUrl);
    payload = {
      ...payload,
      video_url: videoUrl,
      video_id: videoId,
      video_provider: "youtube",
      video_start_at: videoStartAt,
    };
  } else if (type === "file") {
    const fileUrl = asText(formData.get("video_url"));
    if (!fileUrl) {
      return { success: false, error: "URL do ficheiro é obrigatória." };
    }
    const fileType = asText(formData.get("video_provider")) || "outro";
    payload = {
      ...payload,
      video_url: fileUrl,
      video_provider: fileType,
    };
  } else if (type === "link") {
    const linkUrl = asText(formData.get("video_url"));
    if (!linkUrl) {
      return { success: false, error: "URL do link é obrigatória." };
    }
    const description = asText(formData.get("markdown_content")) || null;
    payload = {
      ...payload,
      video_url: linkUrl,
      video_provider: "link",
      markdown_content: description,
    };
  }

  let resultId: number | undefined;

  if (id) {
    const { error } = await supabase
      .from("edu_content_resources")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("saveResource update failed:", error);
      return { success: false, error: error.message };
    }
    resultId = parseInt(id, 10);
  } else {
    const { data, error } = await supabase
      .from("edu_content_resources")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      console.error("saveResource insert failed:", error);
      return { success: false, error: error.message };
    }
    resultId = data?.id;
  }

  revalidateAll();
  return { success: true, id: resultId };
}

export async function deleteResource(
  id: number
): Promise<{ success: boolean; error?: string }> {
  await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();

  const { data: resource, error: fetchError } = await supabase
    .from("edu_content_resources")
    .select("type")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const { error } = await supabase
    .from("edu_content_resources")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteResource failed:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();

  const type = resource?.type;
  if (type === "summary") redirect("/manager/content/academy/resumos");
  if (type === "video") redirect("/manager/content/academy/videos");
  if (type === "file") redirect("/manager/content/academy/ficheiros");
  if (type === "link") redirect("/manager/content/academy/links");

  redirect("/manager/content/academy");
}

export async function deleteResourceById(
  id: number,
  redirectTo: string
): Promise<void> {
  await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("edu_content_resources")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteResourceById failed:", error);
    // Still redirect on error to avoid leaving user stuck
    redirect(redirectTo);
  }

  revalidateAll();
  redirect(redirectTo);
}
