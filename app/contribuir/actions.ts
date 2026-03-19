"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  checkRateLimitPersisted,
  requireTrustedOriginForAction,
} from "@/lib/request-security";
import {
  CONTRIBUTION_ATTACHMENT_BUCKET,
  CONTRIBUTION_MAX_FILES,
  CONTRIBUTION_MAX_FILE_SIZE_BYTES,
  CONTRIBUTION_MAX_TOTAL_SIZE_BYTES,
  formatContributionBytes,
  getContributionFileExtension,
  isAllowedContributionFileType,
  serializeContributionContent,
  type ContributionAttachment,
} from "@/lib/public-submissions";

interface SubmissionInput {
  content: string;
  email: string;
  escola: string;
  source_name: string;
  subtema_id: string;
  suggestion: string;
  title: string;
  type: string;
  url: string;
}

function normalizeInstagramHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

async function ensureAttachmentBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw listError;
  }

  if (buckets?.some((bucket) => bucket.id === CONTRIBUTION_ATTACHMENT_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(CONTRIBUTION_ATTACHMENT_BUCKET, {
    allowedMimeTypes: [
      "application/msword",
      "application/octet-stream",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/x-zip-compressed",
      "application/zip",
      "image/jpeg",
      "image/png",
      "multipart/x-zip",
    ],
    fileSizeLimit: CONTRIBUTION_MAX_FILE_SIZE_BYTES,
    public: false,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw createError;
  }
}

function slugifyFilename(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80)
      || "ficheiro"
  );
}

export async function submitContribution(formData: FormData): Promise<{ error: string } | never> {
  try {
    await requireTrustedOriginForAction();
  } catch {
    return { error: "Pedido inválido. Atualiza a página e tenta novamente." };
  }

  const headerStore = await headers();
  const clientIp =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip")?.trim() ??
    "unknown";
  const rateLimit = await checkRateLimitPersisted({
    key: `contribuir:${clientIp}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return { error: "Muitos envios num curto espaço de tempo. Tenta novamente daqui a pouco." };
  }

  const honeypot = ((formData.get("website") as string | null) ?? "").trim();
  if (honeypot) {
    return { error: "Pedido inválido." };
  }

  const startedAtRaw = (formData.get("started_at") as string | null) ?? "";
  const startedAt = Number.parseInt(startedAtRaw, 10);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500) {
    return { error: "Envio demasiado rápido. Revê o formulário e tenta novamente." };
  }

  const input: SubmissionInput = {
    content: (formData.get("content") as string | null) ?? "",
    email: (formData.get("email") as string | null) ?? "",
    escola: (formData.get("escola") as string | null) ?? "",
    source_name: (formData.get("source_name") as string | null) ?? "",
    subtema_id: (formData.get("subtema_id") as string | null) ?? "",
    suggestion: (formData.get("suggestion") as string | null) ?? "",
    title: (formData.get("title") as string | null) ?? "",
    type: (formData.get("type") as string | null) ?? "",
    url: (formData.get("url") as string | null) ?? "",
  };
  const escola = input.escola.trim();
  const instagramHandle = normalizeInstagramHandle(input.source_name);
  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!input.type || !input.title.trim()) {
    return { error: "Preenche o tipo e o titulo antes de enviar." };
  }

  if (!input.url.trim() && !input.content.trim() && files.length === 0) {
    return { error: "Adiciona um link, um ficheiro ou uma descricao curta." };
  }

  if (files.length > CONTRIBUTION_MAX_FILES) {
    return { error: `Podes enviar ate ${CONTRIBUTION_MAX_FILES} ficheiros de cada vez.` };
  }

  let totalSize = 0;
  for (const file of files) {
    totalSize += file.size;

    if (file.size > CONTRIBUTION_MAX_FILE_SIZE_BYTES) {
      return {
        error: `${file.name} ultrapassa o limite de ${formatContributionBytes(CONTRIBUTION_MAX_FILE_SIZE_BYTES)}.`,
      };
    }

    if (!isAllowedContributionFileType(file.type, file.name)) {
      return { error: `${file.name} nao tem um formato suportado.` };
    }
  }

  if (totalSize > CONTRIBUTION_MAX_TOTAL_SIZE_BYTES) {
    return {
      error: `O total dos anexos nao pode ultrapassar ${formatContributionBytes(CONTRIBUTION_MAX_TOTAL_SIZE_BYTES)}.`,
    };
  }

  const supabase = getSupabaseAdmin();
  const subtemaId = input.subtema_id ? parseInt(input.subtema_id, 10) : null;
  const uploadedPaths: string[] = [];
  const attachments: ContributionAttachment[] = [];

  if (files.length > 0) {
    try {
      await ensureAttachmentBucket();
    } catch (error) {
      console.error("Failed to ensure attachment bucket:", error);
      return { error: "Nao foi possivel preparar o upload dos ficheiros. Tenta novamente." };
    }

    for (const file of files) {
      const extension = getContributionFileExtension(file.name);
      const safeBaseName = slugifyFilename(file.name.replace(/\.[^.]+$/, ""));
      const filePath = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${safeBaseName}${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(CONTRIBUTION_ATTACHMENT_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type || undefined,
          upsert: false,
        });

      if (uploadError) {
        console.error("Failed to upload contribution attachment:", uploadError);

        if (uploadedPaths.length > 0) {
          await supabase.storage.from(CONTRIBUTION_ATTACHMENT_BUCKET).remove(uploadedPaths);
        }

        return { error: `Nao foi possivel enviar ${file.name}. Tenta novamente.` };
      }

      uploadedPaths.push(filePath);
      attachments.push({
        extension,
        mimeType: file.type || "application/octet-stream",
        name: file.name,
        path: filePath,
        size: file.size,
      });
    }
  }

  const serializedContent = serializeContributionContent(input.content, {
    attachments,
    sourceName: input.source_name,
    suggestion: input.suggestion,
  });

  const { error: insertError } = await supabase.from("public_submissions").insert({
    content: serializedContent,
    email: input.email.trim() || null,
    escola: escola || null,
    instagram_handle: instagramHandle || null,
    status: "pending",
    subtema_id: subtemaId,
    title: input.title.trim(),
    type: input.type,
    url: input.url.trim() || null,
  });

  if (insertError) {
    console.error("Failed to insert submission:", insertError);

    if (uploadedPaths.length > 0) {
      await supabase.storage.from(CONTRIBUTION_ATTACHMENT_BUCKET).remove(uploadedPaths);
    }

    return { error: "Ocorreu um erro ao enviar. Tenta novamente." };
  }

  const { error: notificationError } = await supabase.from("ops_notifications").insert({
    type: "public_submission",
    message: `Nova sugestao: "${input.title.trim()}" (${input.type})`,
    meta: {
      attachments_count: attachments.length,
      email: input.email.trim() || null,
      has_description: Boolean(input.content.trim()),
      instagram_handle: instagramHandle || null,
      source_name: input.source_name.trim() || null,
      submission_type: input.type,
      suggestion: input.suggestion.trim() || null,
      title: input.title.trim(),
    },
  });

  if (notificationError) {
    console.error("Failed to create ops notification:", notificationError);
  }

  redirect("/contribuir/obrigado");
}
