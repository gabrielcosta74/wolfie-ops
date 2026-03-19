import { getSupabaseAdmin } from "@/lib/supabase-admin";

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function extractEmailLocalPart(email: string | undefined | null) {
  if (!email) return null;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return null;
  return normalizeIdentifier(email.slice(0, atIndex));
}

function candidateValuesForUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
}) {
  const candidates = new Set<string>();

  if (user.email) {
    candidates.add(normalizeIdentifier(user.email));
    const localPart = extractEmailLocalPart(user.email);
    if (localPart) {
      candidates.add(localPart);
    }
  }

  for (const source of [user.user_metadata, user.app_metadata]) {
    if (!source) continue;

    for (const key of ["username", "user_name", "preferred_username", "handle"]) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) {
        candidates.add(normalizeIdentifier(value));
      }
    }
  }

  return candidates;
}

export async function resolveLoginIdentifier(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;

  const supabase = getSupabaseAdmin();
  const matches = new Map<string, { email: string; userId: string }>();

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (!user.email) continue;
      const candidates = candidateValuesForUser(user);
      if (candidates.has(normalized)) {
        matches.set(user.id, {
          email: normalizeIdentifier(user.email),
          userId: user.id,
        });
      }
    }

    if (data.users.length < 200) {
      break;
    }
  }

  if (matches.size === 1) {
    return [...matches.values()][0] ?? null;
  }

  return null;
}
