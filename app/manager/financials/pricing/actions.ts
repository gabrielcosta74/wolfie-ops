"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function asText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

async function logAudit(params: {
  profileId: string;
  entityType: string;
  entityKey: string;
  changeType: string;
  beforeJson: Record<string, unknown>;
  afterJson: Record<string, unknown>;
  reason?: string | null;
}) {
  const supabase = getSupabaseAdmin();

  await supabase.from("ops_pricing_audit_log").insert({
    profile_id: params.profileId,
    entity_type: params.entityType,
    entity_key: params.entityKey,
    change_type: params.changeType,
    before_json: params.beforeJson,
    after_json: params.afterJson,
    reason: params.reason ?? null,
  });
}

function revalidatePricingPaths() {
  revalidatePath("/manager/financials");
  revalidatePath("/manager/financials/pricing");
  revalidatePath("/manager/financials/scenarios");
  revalidatePath("/manager/financials/tokens");
  revalidatePath("/manager/financials/users");
  revalidatePath("/manager/financials/agents");
}

export async function savePlanSetting(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const profileId = asText(formData.get("profile_id"));
  const planCode = asText(formData.get("plan_code"));

  if (!profileId || !planCode) return;

  const { data: existing } = await supabase
    .from("ops_pricing_plan_settings")
    .select("*")
    .eq("profile_id", profileId)
    .eq("plan_code", planCode)
    .maybeSingle();

  const patch = {
    label: asText(formData.get("label")) ?? planCode,
    monthly_price_eur: asNumber(formData.get("monthly_price_eur")) ?? 0,
    annual_price_eur: asNumber(formData.get("annual_price_eur")),
    daily_braincells: asNumber(formData.get("daily_braincells")) ?? 0,
    monthly_braincells: asNumber(formData.get("monthly_braincells")) ?? 0,
    carryover_limit: asNumber(formData.get("carryover_limit")) ?? 0,
    image_daily_limit: asNumber(formData.get("image_daily_limit")),
    image_weekly_limit: asNumber(formData.get("image_weekly_limit")),
    message_rate_limit_10m: asNumber(formData.get("message_rate_limit_10m")),
    cooldown_seconds: asNumber(formData.get("cooldown_seconds")) ?? 0,
    notes: asText(formData.get("notes")),
  };

  const { error } = await supabase
    .from("ops_pricing_plan_settings")
    .update(patch)
    .eq("profile_id", profileId)
    .eq("plan_code", planCode);

  if (error) {
    console.error("savePlanSetting error", error);
    return;
  }

  await logAudit({
    profileId,
    entityType: "plan_setting",
    entityKey: planCode,
    changeType: "update",
    beforeJson: existing ?? {},
    afterJson: patch,
    reason: asText(formData.get("reason")),
  });

  revalidatePricingPaths();
}

export async function saveFeatureSetting(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const profileId = asText(formData.get("profile_id"));
  const featureKey = asText(formData.get("feature_key"));

  if (!profileId || !featureKey) return;

  const { data: existing } = await supabase
    .from("ops_pricing_feature_settings")
    .select("*")
    .eq("profile_id", profileId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  const patch = {
    label: asText(formData.get("label")) ?? featureKey,
    description: asText(formData.get("description")),
    braincells_free: asNumber(formData.get("braincells_free")) ?? 0,
    braincells_premium: asNumber(formData.get("braincells_premium")) ?? 0,
    free_daily_limit: asNumber(formData.get("free_daily_limit")),
    premium_daily_limit: asNumber(formData.get("premium_daily_limit")),
    free_weekly_limit: asNumber(formData.get("free_weekly_limit")),
    premium_weekly_limit: asNumber(formData.get("premium_weekly_limit")),
    provider_model: asText(formData.get("provider_model")),
    fallback_cost_eur: asNumber(formData.get("fallback_cost_eur")) ?? 0,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase
    .from("ops_pricing_feature_settings")
    .update(patch)
    .eq("profile_id", profileId)
    .eq("feature_key", featureKey);

  if (error) {
    console.error("saveFeatureSetting error", error);
    return;
  }

  await logAudit({
    profileId,
    entityType: "feature_setting",
    entityKey: featureKey,
    changeType: "update",
    beforeJson: existing ?? {},
    afterJson: patch,
    reason: asText(formData.get("reason")),
  });

  revalidatePricingPaths();
}

export async function saveProviderCostSetting(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const profileId = asText(formData.get("profile_id"));
  const modelKey = asText(formData.get("model_key"));

  if (!profileId || !modelKey) return;

  const { data: existing } = await supabase
    .from("ops_provider_cost_settings")
    .select("*")
    .eq("profile_id", profileId)
    .eq("model_key", modelKey)
    .maybeSingle();

  const patch = {
    label: asText(formData.get("label")) ?? modelKey,
    input_per_1m_eur: asNumber(formData.get("input_per_1m_eur")) ?? 0,
    output_per_1m_eur: asNumber(formData.get("output_per_1m_eur")) ?? 0,
    image_tile_tokens: asNumber(formData.get("image_tile_tokens")) ?? 258,
    fallback_per_call_eur: asNumber(formData.get("fallback_per_call_eur")) ?? 0,
    notes: asText(formData.get("notes")),
  };

  const { error } = await supabase
    .from("ops_provider_cost_settings")
    .update(patch)
    .eq("profile_id", profileId)
    .eq("model_key", modelKey);

  if (error) {
    console.error("saveProviderCostSetting error", error);
    return;
  }

  await logAudit({
    profileId,
    entityType: "provider_cost",
    entityKey: modelKey,
    changeType: "update",
    beforeJson: existing ?? {},
    afterJson: patch,
    reason: asText(formData.get("reason")),
  });

  revalidatePricingPaths();
}

export async function saveInfraCostSetting(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const profileId = asText(formData.get("profile_id"));
  const costKey = asText(formData.get("cost_key"));

  if (!profileId || !costKey) return;

  const { data: existing } = await supabase
    .from("ops_infra_cost_settings")
    .select("*")
    .eq("profile_id", profileId)
    .eq("cost_key", costKey)
    .maybeSingle();

  const patch = {
    label: asText(formData.get("label")) ?? costKey,
    monthly_cost_eur: asNumber(formData.get("monthly_cost_eur")) ?? 0,
    notes: asText(formData.get("notes")),
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase
    .from("ops_infra_cost_settings")
    .update(patch)
    .eq("profile_id", profileId)
    .eq("cost_key", costKey);

  if (error) {
    console.error("saveInfraCostSetting error", error);
    return;
  }

  await logAudit({
    profileId,
    entityType: "infra_cost",
    entityKey: costKey,
    changeType: "update",
    beforeJson: existing ?? {},
    afterJson: patch,
    reason: asText(formData.get("reason")),
  });

  revalidatePricingPaths();
}

export async function saveStoreItem(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const profileId = asText(formData.get("profile_id"));
  const itemKey = asText(formData.get("item_key"));

  if (!profileId || !itemKey) return;

  const { data: existing } = await supabase
    .from("ops_pricing_store_items")
    .select("*")
    .eq("profile_id", profileId)
    .eq("item_key", itemKey)
    .maybeSingle();

  const patch = {
    label: asText(formData.get("label")) ?? itemKey,
    price_eur: asNumber(formData.get("price_eur")) ?? 0,
    braincells_amount: asNumber(formData.get("braincells_amount")) ?? 0,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase
    .from("ops_pricing_store_items")
    .update(patch)
    .eq("profile_id", profileId)
    .eq("item_key", itemKey);

  if (error) {
    console.error("saveStoreItem error", error);
    return;
  }

  await logAudit({
    profileId,
    entityType: "store_item",
    entityKey: itemKey,
    changeType: "update",
    beforeJson: existing ?? {},
    afterJson: patch,
    reason: asText(formData.get("reason")),
  });

  revalidatePricingPaths();
}

export async function resetDraftFromActive() {
  const supabase = getSupabaseAdmin();
  const { data: draftProfile } = await supabase
    .from("ops_pricing_profiles")
    .select("*")
    .eq("status", "draft")
    .maybeSingle();
  const { data: activeProfile } = await supabase
    .from("ops_pricing_profiles")
    .select("*")
    .eq("status", "active")
    .maybeSingle();

  if (!draftProfile || !activeProfile) return;

  const [plansRes, featuresRes, providerRes, infraRes, storeRes] = await Promise.all([
    supabase.from("ops_pricing_plan_settings").select("*").eq("profile_id", activeProfile.id),
    supabase.from("ops_pricing_feature_settings").select("*").eq("profile_id", activeProfile.id),
    supabase.from("ops_provider_cost_settings").select("*").eq("profile_id", activeProfile.id),
    supabase.from("ops_infra_cost_settings").select("*").eq("profile_id", activeProfile.id),
    supabase.from("ops_pricing_store_items").select("*").eq("profile_id", activeProfile.id),
  ]);

  if (plansRes.error || featuresRes.error || providerRes.error || infraRes.error || storeRes.error) {
    console.error("resetDraftFromActive read error", plansRes.error || featuresRes.error || providerRes.error || infraRes.error || storeRes.error);
    return;
  }

  await Promise.all([
    supabase.from("ops_pricing_plan_settings").delete().eq("profile_id", draftProfile.id),
    supabase.from("ops_pricing_feature_settings").delete().eq("profile_id", draftProfile.id),
    supabase.from("ops_provider_cost_settings").delete().eq("profile_id", draftProfile.id),
    supabase.from("ops_infra_cost_settings").delete().eq("profile_id", draftProfile.id),
    supabase.from("ops_pricing_store_items").delete().eq("profile_id", draftProfile.id),
  ]);

  if ((plansRes.data ?? []).length > 0) {
    await supabase.from("ops_pricing_plan_settings").insert(
      (plansRes.data ?? []).map(({ id, created_at, updated_at, ...row }) => ({ ...row, profile_id: draftProfile.id }))
    );
  }

  if ((featuresRes.data ?? []).length > 0) {
    await supabase.from("ops_pricing_feature_settings").insert(
      (featuresRes.data ?? []).map(({ id, created_at, updated_at, ...row }) => ({ ...row, profile_id: draftProfile.id }))
    );
  }

  if ((providerRes.data ?? []).length > 0) {
    await supabase.from("ops_provider_cost_settings").insert(
      (providerRes.data ?? []).map(({ id, created_at, updated_at, ...row }) => ({ ...row, profile_id: draftProfile.id }))
    );
  }

  if ((infraRes.data ?? []).length > 0) {
    await supabase.from("ops_infra_cost_settings").insert(
      (infraRes.data ?? []).map(({ id, created_at, updated_at, ...row }) => ({ ...row, profile_id: draftProfile.id }))
    );
  }

  if ((storeRes.data ?? []).length > 0) {
    await supabase.from("ops_pricing_store_items").insert(
      (storeRes.data ?? []).map(({ id, created_at, updated_at, ...row }) => ({ ...row, profile_id: draftProfile.id }))
    );
  }

  await supabase
    .from("ops_pricing_profiles")
    .update({ notes: "Draft resetado a partir do perfil ativo.", updated_at: new Date().toISOString() })
    .eq("id", draftProfile.id);

  await logAudit({
    profileId: draftProfile.id,
    entityType: "pricing_profile",
    entityKey: "draft",
    changeType: "reset_from_active",
    beforeJson: { previousDraftId: draftProfile.id },
    afterJson: { sourceProfileId: activeProfile.id },
    reason: "Reset manual do draft a partir do ativo.",
  });

  revalidatePricingPaths();
}

export async function publishDraftPricing() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("ops_publish_draft_pricing");

  if (error) {
    console.error("publishDraftPricing error", error);
    return;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (row?.active_profile_id) {
    await logAudit({
      profileId: row.active_profile_id,
      entityType: "pricing_profile",
      entityKey: "publish",
      changeType: "publish_draft",
      beforeJson: { archivedProfileId: row.archived_profile_id ?? null },
      afterJson: { activeProfileId: row.active_profile_id, newDraftProfileId: row.draft_profile_id ?? null },
      reason: "Draft publicado para active no Wolfie Ops.",
    });
  }

  revalidatePricingPaths();
}

export async function rollbackPricingProfile(formData: FormData) {
  const supabase = getSupabaseAdmin();
  const targetProfileId = asText(formData.get("target_profile_id"));

  if (!targetProfileId) return;

  const { data, error } = await supabase.rpc("ops_rollback_pricing", {
    p_target_profile_id: targetProfileId,
  });

  if (error) {
    console.error("rollbackPricingProfile error", error);
    return;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (row?.restored_active_profile_id) {
    await logAudit({
      profileId: row.restored_active_profile_id,
      entityType: "pricing_profile",
      entityKey: "rollback",
      changeType: "rollback_to_archived",
      beforeJson: { previousActiveProfileId: row.previous_active_profile_id ?? null },
      afterJson: { restoredActiveProfileId: row.restored_active_profile_id, draftProfileId: row.draft_profile_id ?? null },
      reason: "Rollback manual executado no Wolfie Ops.",
    });
  }

  revalidatePricingPaths();
}
