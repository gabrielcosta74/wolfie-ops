export const CONTRIBUTION_ATTACHMENT_BUCKET = "public-submission-files";
export const CONTRIBUTION_MAX_FILES = 3;
export const CONTRIBUTION_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const CONTRIBUTION_MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024;

export const CONTRIBUTION_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
  ".zip",
] as const;

const CONTRIBUTION_ALLOWED_MIME_TYPES = new Set([
  "application/msword",
  "application/octet-stream",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/x-zip-compressed",
  "application/zip",
  "image/jpeg",
  "image/png",
  "multipart/x-zip",
]);

const META_START = "[[WOLFIE_SUBMISSION_META]]";
const META_END = "[[/WOLFIE_SUBMISSION_META]]";

export type ContributionAttachment = {
  extension: string;
  mimeType: string;
  name: string;
  path: string;
  size: number;
};

export type ContributionMeta = {
  attachments?: ContributionAttachment[];
  sourceName?: string | null;
  suggestion?: string | null;
};

export type ParsedContributionContent = {
  description: string;
  meta: ContributionMeta;
};

export function formatContributionBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function getContributionFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

export function isAllowedContributionFileType(mimeType: string, filename: string) {
  const extension = getContributionFileExtension(filename);
  return CONTRIBUTION_ALLOWED_EXTENSIONS.includes(extension as (typeof CONTRIBUTION_ALLOWED_EXTENSIONS)[number])
    || CONTRIBUTION_ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function parseContributionContent(rawContent: string | null | undefined): ParsedContributionContent {
  const content = rawContent?.trim() ?? "";
  const metaStartIndex = content.indexOf(META_START);

  if (metaStartIndex === -1) {
    return { description: content, meta: {} };
  }

  const metaEndIndex = content.indexOf(META_END, metaStartIndex + META_START.length);
  if (metaEndIndex === -1) {
    return { description: content, meta: {} };
  }

  const description = content.slice(0, metaStartIndex).trim();
  const rawMeta = content.slice(metaStartIndex + META_START.length, metaEndIndex).trim();

  try {
    const parsedMeta = JSON.parse(rawMeta) as ContributionMeta;

    return {
      description,
      meta: {
        attachments: Array.isArray(parsedMeta.attachments)
          ? parsedMeta.attachments.filter((attachment) => Boolean(attachment?.name && attachment?.path))
          : [],
        sourceName: parsedMeta.sourceName?.trim() || null,
        suggestion: parsedMeta.suggestion?.trim() || null,
      },
    };
  } catch {
    return { description: content, meta: {} };
  }
}

export function serializeContributionContent(description: string, meta: ContributionMeta) {
  const trimmedDescription = description.trim();
  const payload: ContributionMeta = {
    attachments: (meta.attachments ?? []).filter((attachment) => Boolean(attachment.name && attachment.path)),
    sourceName: meta.sourceName?.trim() || null,
    suggestion: meta.suggestion?.trim() || null,
  };

  const hasMeta =
    Boolean(payload.attachments?.length)
    || Boolean(payload.sourceName)
    || Boolean(payload.suggestion);

  if (!trimmedDescription && !hasMeta) {
    return null;
  }

  if (!hasMeta) {
    return trimmedDescription || null;
  }

  return [trimmedDescription, META_START, JSON.stringify(payload), META_END]
    .filter(Boolean)
    .join("\n\n");
}
