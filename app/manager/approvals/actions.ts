"use server";

import { revalidatePath } from "next/cache";
import { requireManagerUser } from "@/lib/ops-auth";
import { requireTrustedOriginForAction } from "@/lib/request-security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  CONTRIBUTION_ATTACHMENT_BUCKET,
  parseContributionContent,
  serializeContributionContent,
  type ContributionAttachment,
} from "@/lib/public-submissions";

const EDU_CONTENT_FILE_BUCKET = "edu-content-files";

function asText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

function normalizeInstagramHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function extractYoutubeId(url: string): string | null {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function slugifyFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "ficheiro"
  );
}

async function ensureEduAttachmentBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw listError;
  }

  if (buckets?.some((bucket) => bucket.id === EDU_CONTENT_FILE_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(EDU_CONTENT_FILE_BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw createError;
  }
}

async function publishAttachmentToEduBucket(attachment: ContributionAttachment) {
  const supabase = getSupabaseAdmin();

  await ensureEduAttachmentBucket();

  const downloadRes = await supabase.storage
    .from(CONTRIBUTION_ATTACHMENT_BUCKET)
    .download(attachment.path);

  if (downloadRes.error || !downloadRes.data) {
    throw downloadRes.error ?? new Error("Attachment not found.");
  }

  const safeBaseName = slugifyFilename(attachment.name.replace(/\.[^.]+$/, ""));
  const destinationPath = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${safeBaseName}${attachment.extension}`;

  const uploadRes = await supabase.storage
    .from(EDU_CONTENT_FILE_BUCKET)
    .upload(destinationPath, downloadRes.data, {
      contentType: attachment.mimeType || undefined,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadRes.error) {
    throw uploadRes.error;
  }

  const publicUrlRes = supabase.storage
    .from(EDU_CONTENT_FILE_BUCKET)
    .getPublicUrl(destinationPath);

  return {
    fileUrl: publicUrlRes.data.publicUrl,
    fileType: attachment.extension.replace(".", "") || attachment.mimeType || "ficheiro",
  };
}

function revalidateAll() {
  revalidatePath("/manager/approvals");
  revalidatePath("/manager/content/academy", "layout");
  revalidatePath("/manager/content/academy/resumos", "layout");
  revalidatePath("/manager/content/academy/videos", "layout");
  revalidatePath("/manager/content/academy/ficheiros", "layout");
  revalidatePath("/manager/content/academy/links", "layout");
}

export async function approveSubmission(id: string) {
  await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("public_submissions")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Failed to approve submission:", error);
    return { error: "Falha ao aprovar." };
  }

  revalidateAll();
  return { success: true };
}

export async function publishSubmission(formData: FormData) {
  await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();

  const submissionId = asText(formData.get("submission_id"));
  const subtemaId = asNumber(formData.get("subtema_id"));
  const title = asText(formData.get("title"));
  const resourceType = asText(formData.get("resource_type"));
  const authorCredit = asText(formData.get("author_credit")) || null;
  const resourceUrl = asText(formData.get("resource_url"));
  const markdownContent = asText(formData.get("markdown_content")) || null;
  const instagramHandle = normalizeInstagramHandle(asText(formData.get("instagram_handle")));
  const isPremium = asBoolean(formData.get("is_premium"));
  const selectedAttachmentPath = asText(formData.get("attachment_path"));

  if (!submissionId) {
    return { success: false, error: "Submissão inválida." };
  }

  if (!subtemaId) {
    return { success: false, error: "Subtópico é obrigatório." };
  }

  if (!title) {
    return { success: false, error: "Título é obrigatório." };
  }

  if (!["summary", "video", "file", "link"].includes(resourceType)) {
    return { success: false, error: "Tipo editorial inválido." };
  }

  const { data: submission, error: fetchError } = await supabase
    .from("public_submissions")
    .select("id, type, content, source_name:notes")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    console.error("Failed to fetch submission for publish:", fetchError);
    return { success: false, error: "Submissão não encontrada." };
  }

  const parsed = parseContributionContent(submission.content);
  const attachments = parsed.meta.attachments ?? [];

  let payload: Record<string, unknown> = {
    subtema_id: subtemaId,
    title,
    type: resourceType,
    author_credit: authorCredit || instagramHandle || parsed.meta.sourceName || null,
    is_premium: isPremium,
    video_url: null,
    video_id: null,
    video_provider: null,
    video_start_at: 0,
    markdown_content: null,
  };

  if (resourceType === "summary") {
    if (!markdownContent) {
      return { success: false, error: "Resumo precisa de conteúdo." };
    }
    payload = {
      ...payload,
      markdown_content: markdownContent,
    };
  } else if (resourceType === "video") {
    if (!resourceUrl) {
      return { success: false, error: "Vídeo precisa de URL." };
    }
    payload = {
      ...payload,
      video_url: resourceUrl,
      video_id: extractYoutubeId(resourceUrl),
      video_provider: "youtube",
    };
  } else if (resourceType === "link") {
    if (!resourceUrl) {
      return { success: false, error: "Link precisa de URL." };
    }
    payload = {
      ...payload,
      video_url: resourceUrl,
      video_provider: "link",
      markdown_content: markdownContent,
    };
  } else if (resourceType === "file") {
    let fileUrl = resourceUrl;
    let fileType = "ficheiro";

    if (!fileUrl) {
      const attachment = attachments.find((item) => item.path === selectedAttachmentPath);
      if (!attachment) {
        return { success: false, error: "Escolhe um ficheiro ou indica uma URL." };
      }

      try {
        const published = await publishAttachmentToEduBucket(attachment);
        fileUrl = published.fileUrl;
        fileType = published.fileType;
      } catch (error) {
        console.error("Failed to publish attachment to edu bucket:", error);
        return { success: false, error: "Não foi possível publicar o ficheiro." };
      }
    }

    payload = {
      ...payload,
      video_url: fileUrl,
      video_provider: fileType,
      markdown_content: markdownContent,
    };
  }

  const insertRes = await supabase
    .from("edu_content_resources")
    .insert(payload)
    .select("id")
    .single();

  if (insertRes.error || !insertRes.data) {
    console.error("Failed to insert edu content resource:", insertRes.error);
    return { success: false, error: insertRes.error?.message ?? "Falha a publicar recurso." };
  }

  const updatedContent = serializeContributionContent(markdownContent ?? "", {
    attachments,
    sourceName: parsed.meta.sourceName ?? authorCredit,
    suggestion: parsed.meta.suggestion,
  });

  const updateRes = await supabase
    .from("public_submissions")
    .update({
      title,
      subtema_id: subtemaId,
      url: resourceUrl || null,
      content: updatedContent,
      instagram_handle: instagramHandle || null,
      status: "approved",
      approved_resource_id: insertRes.data.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateRes.error) {
    console.error("Failed to update public submission after publish:", updateRes.error);
    return { success: false, error: "Recurso criado, mas falhou a finalização da submissão." };
  }

  revalidateAll();
  return { success: true, resourceId: insertRes.data.id };
}

export async function rejectSubmission(id: string) {
  await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();

  const { data: submission } = await supabase
    .from("public_submissions")
    .select("content")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("public_submissions")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Failed to reject submission:", error);
    return { error: "Falha ao rejeitar." };
  }

  if (submission?.content) {
    const parsed = parseContributionContent(submission.content);
    const paths = parsed.meta.attachments?.map((a) => a.path) ?? [];
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(CONTRIBUTION_ATTACHMENT_BUCKET)
        .remove(paths);
      if (storageError) {
        console.error("Failed to delete submission attachments:", storageError);
      }
    }
  }

  revalidateAll();
  return { success: true };
}

export async function approveMCQ(id: string) {
  await requireManagerUser();
  await requireTrustedOriginForAction();
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
  await requireManagerUser();
  await requireTrustedOriginForAction();
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

export async function acknowledgeReview(id: string) {
  await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("ops_notifications")
    .update({ seen: true })
    .eq("id", id);

  if (error) {
    console.error("Failed to acknowledge review:", error);
    return { error: "Falha ao reconhecer." };
  }

  revalidatePath("/manager/approvals");
  return { success: true };
}
