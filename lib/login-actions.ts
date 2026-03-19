"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseServer } from "@/lib/supabase-server";
import { resolveLoginIdentifier } from "@/lib/auth-identifier";
import { checkRateLimitPersisted } from "@/lib/request-security";

export type LoginState = {
  error: string;
};

function getClientIp(headerStore: Headers) {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

async function authenticateWithRole(params: {
  formData: FormData;
  allowedRoles: Set<string>;
  allowedRedirectPrefixes: string[];
  rateLimitKey: string;
  successPath: string;
}) {
  const headerStore = await headers();
  const identifier = String(params.formData.get("identifier") ?? "").trim();
  const nextPath = String(params.formData.get("next") ?? "").trim();
  const password = String(params.formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Username/email ou password incorretos." };
  }

  const rateLimit = await checkRateLimitPersisted({
    key: `${params.rateLimitKey}:${getClientIp(headerStore)}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return { error: "Demasiadas tentativas. Tenta novamente daqui a pouco." };
  }

  const resolved = await resolveLoginIdentifier(identifier);
  if (!resolved) {
    return { error: "Username/email ou password incorretos." };
  }

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", resolved.userId)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load login role:", profileError);
    return { error: "Nao foi possivel iniciar sessao. Tenta novamente." };
  }

  if (!params.allowedRoles.has(profile?.role ?? "")) {
    return { error: "Username/email ou password incorretos." };
  }

  const supabase = await getSupabaseServer();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: resolved.email,
    password,
  });

  if (authError) {
    return { error: "Username/email ou password incorretos." };
  }

  const safeNext =
    nextPath.startsWith("/") &&
    params.allowedRedirectPrefixes.some(
      (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}/`),
    )
      ? nextPath
      : params.successPath;

  redirect(safeNext);
}

export async function loginManager(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  return authenticateWithRole({
    formData,
    allowedRoles: new Set(["admin"]),
    allowedRedirectPrefixes: ["/manager", "/inbox", "/reviews", "/schedule", "/settings", "/system"],
    rateLimitKey: "ops-login",
    successPath: "/manager",
  });
}

export async function loginStudio(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  return authenticateWithRole({
    formData,
    allowedRoles: new Set(["teacher", "admin"]),
    allowedRedirectPrefixes: ["/studio/teacher"],
    rateLimitKey: "studio-login",
    successPath: "/studio/teacher",
  });
}
