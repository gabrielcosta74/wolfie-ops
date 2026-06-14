"use server";

import { revalidatePath } from "next/cache";
import { requireManagerUser } from "@/lib/ops-auth";
import { requireTrustedOriginForAction } from "@/lib/request-security";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function asText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: FormDataEntryValue | null) {
  const text = asText(value);
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseEmailList(value: FormDataEntryValue | null) {
  const text = asText(value);
  if (!text) return [];
  return text
    .split(/[\n,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function logAudit(params: {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
}) {
  const supabase = getSupabaseAdmin();
  await supabase.from("app_control_audit_log").insert({
    actor_user_id: params.actorUserId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId ?? null,
    before_value: params.beforeValue ?? null,
    after_value: params.afterValue ?? null,
  });
}

function revalidateAppControl() {
  revalidatePath("/manager/app-control");
  revalidatePath("/manager/users");
}

export async function saveAppControlSettings(formData: FormData) {
  const actor = await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();

  const { data: before } = await supabase
    .from("app_control_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  const patch = {
    app_status: asText(formData.get("app_status")) ?? "normal",
    maintenance_allowlist_emails: parseEmailList(formData.get("maintenance_allowlist_emails")),
    beta_all_access_enabled: formData.get("beta_all_access_enabled") === "on",
    beta_daily_braincells: asNumber(formData.get("beta_daily_braincells")) ?? 2000,
  };

  const { data: after, error } = await supabase
    .from("app_control_settings")
    .update(patch)
    .eq("id", true)
    .select("*")
    .single();

  if (error) {
    console.error("saveAppControlSettings error", error);
    return;
  }

  await logAudit({
    actorUserId: actor.id,
    action: "update_settings",
    targetType: "app_control_settings",
    targetId: "global",
    beforeValue: before ?? {},
    afterValue: after ?? patch,
  });

  revalidateAppControl();
}

export async function saveFeatureFlag(formData: FormData) {
  const actor = await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();
  const key = asText(formData.get("key"));
  if (!key) return;

  const { data: before } = await supabase
    .from("app_feature_flags")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  const patch = {
    enabled: formData.get("enabled") === "on",
  };

  const { data: after, error } = await supabase
    .from("app_feature_flags")
    .update(patch)
    .eq("key", key)
    .select("*")
    .single();

  if (error) {
    console.error("saveFeatureFlag error", error);
    return;
  }

  await logAudit({
    actorUserId: actor.id,
    action: "update_feature_flag",
    targetType: "app_feature_flags",
    targetId: key,
    beforeValue: before ?? {},
    afterValue: after ?? patch,
  });

  revalidateAppControl();
}

export async function saveBuildRule(formData: FormData) {
  const actor = await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();
  const platform = asText(formData.get("platform"));
  const buildNumber = asNumber(formData.get("build_number"));
  const appVersion = asText(formData.get("app_version"));
  const status = asText(formData.get("status")) ?? "blocked";

  if (!platform) return;
  const hasBuild = buildNumber !== null;
  const hasVersion = appVersion !== null;
  if (hasBuild === hasVersion) return;

  const targetQuery = supabase
    .from("app_build_rules")
    .select("*")
    .eq("platform", platform);
  const { data: before } = hasBuild
    ? await targetQuery.eq("build_number", buildNumber!).is("app_version", null).maybeSingle()
    : await targetQuery.eq("app_version", appVersion!).is("build_number", null).maybeSingle();

  const patch = {
    platform,
    build_number: hasBuild ? buildNumber : null,
    app_version: hasVersion ? appVersion : null,
    status,
    message: "Versão descontinuada, atualiza",
    notes: asText(formData.get("notes")),
    created_by: actor.id,
  };

  const { data: after, error } = await supabase
    .from("app_build_rules")
    .upsert(patch, {
      onConflict: hasBuild ? "platform,build_number" : "platform,app_version",
    })
    .select("*")
    .single();

  if (error) {
    console.error("saveBuildRule error", error);
    return;
  }

  await logAudit({
    actorUserId: actor.id,
    action: "upsert_build_rule",
    targetType: "app_build_rules",
    targetId: `${platform}:${hasBuild ? `build#${buildNumber}` : `v${appVersion}`}`,
    beforeValue: before ?? {},
    afterValue: after ?? patch,
  });

  revalidateAppControl();
}

export async function blockUserByEmail(formData: FormData) {
  const actor = await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();
  const email = asText(formData.get("email"))?.toLowerCase();
  if (!email) return;

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    console.error("blockUserByEmail listUsers error", listError);
    return;
  }

  const target = usersData.users.find((user) => user.email?.toLowerCase() === email);
  if (!target) {
    console.error(`blockUserByEmail: user not found for ${email}`);
    return;
  }

  const { data: before } = await supabase
    .from("app_user_access")
    .select("*")
    .eq("user_id", target.id)
    .maybeSingle();

  const patch = {
    user_id: target.id,
    email_snapshot: email,
    status: "blocked",
    reason: asText(formData.get("reason")),
    message: "A tua conta está temporariamente bloqueada.",
    blocked_by: actor.id,
    blocked_at: new Date().toISOString(),
    expires_at: null,
  };

  const { data: after, error } = await supabase
    .from("app_user_access")
    .upsert(patch, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    console.error("blockUserByEmail error", error);
    return;
  }

  await logAudit({
    actorUserId: actor.id,
    action: "block_user",
    targetType: "app_user_access",
    targetId: target.id,
    beforeValue: before ?? {},
    afterValue: after ?? patch,
  });

  revalidateAppControl();
}

export async function unblockUser(formData: FormData) {
  const actor = await requireManagerUser();
  await requireTrustedOriginForAction();
  const supabase = getSupabaseAdmin();
  const userId = asText(formData.get("user_id"));
  if (!userId) return;

  const { data: before } = await supabase
    .from("app_user_access")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const patch = {
    status: "active",
    reason: null,
    blocked_by: null,
    blocked_at: null,
    expires_at: null,
  };

  const { data: after, error } = await supabase
    .from("app_user_access")
    .update(patch)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("unblockUser error", error);
    return;
  }

  await logAudit({
    actorUserId: actor.id,
    action: "unblock_user",
    targetType: "app_user_access",
    targetId: userId,
    beforeValue: before ?? {},
    afterValue: after ?? patch,
  });

  revalidateAppControl();
}
