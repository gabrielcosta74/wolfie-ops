import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  COST_PER_CALL_EUR,
  INFRA_COSTS_EUR,
  MODEL_PRICING_EUR,
  PREMIUM_PRICE_EUR,
  TOTAL_INFRA_MONTHLY_EUR,
} from "@/lib/pricing-constants";
import {
  calculateAfterTaxProfit,
  calculateSubscriptionUnitEconomics,
  CONSERVATIVE_PREMIUM_CHANNEL_KEY,
  PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE,
} from "@/lib/subscription-economics";

export type PricingProfileStatus = "draft" | "active" | "archived";

export type PricingProfileRow = {
  id: string;
  name: string;
  status: PricingProfileStatus;
  effective_from: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PricingPlanSettingRow = {
  id?: number;
  profile_id: string;
  plan_code: string;
  label: string;
  monthly_price_eur: number;
  annual_price_eur: number | null;
  daily_braincells: number;
  monthly_braincells: number;
  carryover_limit: number;
  image_daily_limit: number | null;
  image_weekly_limit: number | null;
  message_rate_limit_10m: number | null;
  cooldown_seconds: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PricingFeatureSettingRow = {
  id?: number;
  profile_id: string;
  feature_key: string;
  surface_key: string;
  label: string;
  description: string | null;
  braincells_free: number;
  braincells_premium: number;
  free_daily_limit: number | null;
  premium_daily_limit: number | null;
  free_weekly_limit: number | null;
  premium_weekly_limit: number | null;
  provider_model: string | null;
  fallback_cost_eur: number;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type ProviderCostSettingRow = {
  id?: number;
  profile_id: string;
  model_key: string;
  label: string;
  input_per_1m_eur: number;
  output_per_1m_eur: number;
  image_tile_tokens: number;
  fallback_per_call_eur: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InfraCostSettingRow = {
  id?: number;
  profile_id: string;
  cost_key: string;
  label: string;
  monthly_cost_eur: number;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PricingStoreItemRow = {
  id?: number;
  profile_id: string;
  item_key: string;
  item_type: "subscription" | "braincell_pack";
  label: string;
  plan_code: string | null;
  braincells_amount: number;
  price_eur: number;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type PricingProfileBundle = {
  profile: PricingProfileRow;
  plans: PricingPlanSettingRow[];
  features: PricingFeatureSettingRow[];
  providerCosts: ProviderCostSettingRow[];
  infraCosts: InfraCostSettingRow[];
  storeItems: PricingStoreItemRow[];
  source: "database" | "fallback";
};

export type FeatureUnitEconomics = {
  feature_key: string;
  label: string;
  free_cost_per_braincell_eur: number | null;
  premium_cost_per_braincell_eur: number | null;
  fallback_cost_eur: number;
  provider_model: string | null;
};

export type PricingScenarioMetrics = {
  bundle: PricingProfileBundle;
  observed: {
    totalUsers: number;
    freeUsers: number;
    premiumUsers: number;
    monthlyRevenueEur: number;
    vatOnSubscriptionsEur: number;
    storeFeesEur: number;
    netSubscriptionRevenueEur: number;
    aiCostEur30d: number;
    infraCostMonthlyEur: number;
    pretaxNetMonthlyEur: number;
    estimatedCorporateTaxEur: number;
    netMonthlyEur: number;
  };
  modeled: {
    avgCostPerBraincellEur: number;
    avgChatCostPerBraincellEur: number;
    premiumCostPerBraincellEur: number;
    freeMonthlyLiabilityEur: number;
    freeChatMonthlyLiabilityEur: number;
    freeChatWeeklyBudgetBraincells: number | null;
    premiumVatPerSubscriptionEur: number;
    premiumStoreFeePerSubscriptionEur: number;
    premiumNetRevenuePerSubscriptionEur: number;
    premiumRevenueChannelLabel: string;
    premiumRevenueChannelKey: string;
    premiumRevenueChannelFeeRate: number;
    premiumTaxRate: number;
    premiumMonthlyQuotaCostEur: number;
    premiumContributionMarginEur: number;
    premiumContributionAfterTaxEur: number;
    onePremiumCoversFreeUsers: number | null;
  };
  unitEconomics: FeatureUnitEconomics[];
};

type AiCostViewRow = {
  action_key: string;
  model: string | null;
  event_count: number;
  total_braincells: number;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
};

type WalletPlanRow = {
  plan_code: string;
};

const FALLBACK_PROFILE_IDS = {
  active: "00000000-0000-0000-0000-00000000a001",
  draft: "00000000-0000-0000-0000-00000000d001",
};

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function fallbackFeatures(profileId: string): PricingFeatureSettingRow[] {
  return [
    {
      profile_id: profileId,
      feature_key: "chat_tutor_message",
      surface_key: "chat",
      label: "Mensagem normal",
      description: "Mensagem standard no Explicador.",
      braincells_free: 1,
      braincells_premium: 1,
      free_daily_limit: null,
      premium_daily_limit: null,
      free_weekly_limit: null,
      premium_weekly_limit: null,
      provider_model: "gemini-2.5-flash-lite",
      fallback_cost_eur: COST_PER_CALL_EUR.chat_tutor_message.cost,
      is_active: true,
      sort_order: 10,
    },
    {
      profile_id: profileId,
      feature_key: "chat_tutor_image",
      surface_key: "chat",
      label: "Análise de imagem",
      description: "Análise de imagem enviada no Explicador.",
      braincells_free: 12,
      braincells_premium: 8,
      free_daily_limit: 1,
      premium_daily_limit: 15,
      free_weekly_limit: 2,
      premium_weekly_limit: 60,
      provider_model: "gemini-2.5-flash-lite",
      fallback_cost_eur: 0.0025,
      is_active: true,
      sort_order: 20,
    },
    {
      profile_id: profileId,
      feature_key: "chat_tutor_deep_explanation",
      surface_key: "chat",
      label: "Explicação profunda",
      description: "Resposta mais longa e orientada a método.",
      braincells_free: 5,
      braincells_premium: 5,
      free_daily_limit: 3,
      premium_daily_limit: 10,
      free_weekly_limit: null,
      premium_weekly_limit: null,
      provider_model: "gemini-2.5-flash",
      fallback_cost_eur: COST_PER_CALL_EUR.advanced_explanation.cost,
      is_active: true,
      sort_order: 30,
    },
    {
      profile_id: profileId,
      feature_key: "quiz_quick_doubt",
      surface_key: "quiz",
      label: "Dúvida rápida",
      description: "Atalho de dúvida contextual no quiz.",
      braincells_free: 4,
      braincells_premium: 4,
      free_daily_limit: null,
      premium_daily_limit: null,
      free_weekly_limit: null,
      premium_weekly_limit: null,
      provider_model: "gemini-2.5-flash-lite",
      fallback_cost_eur: COST_PER_CALL_EUR.quick_doubt.cost,
      is_active: true,
      sort_order: 40,
    },
    {
      profile_id: profileId,
      feature_key: "quiz_custom_doubt",
      surface_key: "quiz",
      label: "Dúvida personalizada",
      description: "Pergunta livre no contexto do quiz.",
      braincells_free: 6,
      braincells_premium: 6,
      free_daily_limit: null,
      premium_daily_limit: null,
      free_weekly_limit: null,
      premium_weekly_limit: null,
      provider_model: "gemini-2.5-flash-lite",
      fallback_cost_eur: COST_PER_CALL_EUR.custom_doubt.cost,
      is_active: true,
      sort_order: 50,
    },
    {
      profile_id: profileId,
      feature_key: "short_answer_grading",
      surface_key: "exam",
      label: "Correção curta",
      description: "Correção AI de resposta curta.",
      braincells_free: 12,
      braincells_premium: 12,
      free_daily_limit: 1,
      premium_daily_limit: 8,
      free_weekly_limit: null,
      premium_weekly_limit: null,
      provider_model: "gpt-4o",
      fallback_cost_eur: COST_PER_CALL_EUR.grade_resolution.cost,
      is_active: true,
      sort_order: 60,
    },
    {
      profile_id: profileId,
      feature_key: "exam_ai_grading",
      surface_key: "exam",
      label: "Correção de exame",
      description: "Correção AI de submissão de exame.",
      braincells_free: 25,
      braincells_premium: 25,
      free_daily_limit: null,
      premium_daily_limit: null,
      free_weekly_limit: null,
      premium_weekly_limit: null,
      provider_model: "gemini-2.0-flash-001",
      fallback_cost_eur: COST_PER_CALL_EUR.grade_exam.cost,
      is_active: true,
      sort_order: 70,
    },
  ];
}

function fallbackBundle(status: PricingProfileStatus): PricingProfileBundle {
  const profileId = status === "draft" ? FALLBACK_PROFILE_IDS.draft : FALLBACK_PROFILE_IDS.active;

  const plans: PricingPlanSettingRow[] = [
    {
      profile_id: profileId,
      plan_code: "free",
      label: "Free",
      monthly_price_eur: 0,
      annual_price_eur: null,
      daily_braincells: 50,
      monthly_braincells: 0,
      carryover_limit: 0,
      image_daily_limit: 1,
      image_weekly_limit: 3,
      message_rate_limit_10m: 25,
      cooldown_seconds: 4,
      notes: "Fallback alinhado com a wallet atual.",
    },
    {
      profile_id: profileId,
      plan_code: "premium",
      label: "Premium",
      monthly_price_eur: PREMIUM_PRICE_EUR,
      annual_price_eur: 79.99,
      daily_braincells: 2000,
      monthly_braincells: 0,
      carryover_limit: 0,
      image_daily_limit: 15,
      image_weekly_limit: 60,
      message_rate_limit_10m: 80,
      cooldown_seconds: 1.5,
      notes: "Fallback alinhado com o reporting financeiro atual.",
    },
  ];

  const providerCosts: ProviderCostSettingRow[] = Object.entries(MODEL_PRICING_EUR).map(([model_key, value]) => ({
    profile_id: profileId,
    model_key,
    label: value.label,
    input_per_1m_eur: value.inputPer1M,
    output_per_1m_eur: value.outputPer1M,
    image_tile_tokens: 258,
    fallback_per_call_eur: COST_PER_CALL_EUR.chat_tutor_message.cost,
    notes: null,
  }));

  const infraCosts: InfraCostSettingRow[] = Object.entries(INFRA_COSTS_EUR).map(([cost_key, value], index) => ({
    profile_id: profileId,
    cost_key,
    label: value.description,
    monthly_cost_eur: value.cost,
    is_active: true,
    sort_order: (index + 1) * 10,
    notes: null,
  }));

  const storeItems: PricingStoreItemRow[] = [
    {
      profile_id: profileId,
      item_key: "premium_monthly",
      item_type: "subscription",
      label: "Premium Mensal",
      plan_code: "premium",
      braincells_amount: 0,
      price_eur: PREMIUM_PRICE_EUR,
      is_active: true,
      sort_order: 10,
      metadata: { billing_period: "monthly" },
    },
    {
      profile_id: profileId,
      item_key: "premium_annual",
      item_type: "subscription",
      label: "Premium Anual",
      plan_code: "premium",
      braincells_amount: 0,
      price_eur: 79.99,
      is_active: true,
      sort_order: 20,
      metadata: { billing_period: "annual" },
    },
    {
      profile_id: profileId,
      item_key: "pack_s",
      item_type: "braincell_pack",
      label: "Pack S",
      plan_code: null,
      braincells_amount: 100,
      price_eur: 1.99,
      is_active: true,
      sort_order: 30,
    },
    {
      profile_id: profileId,
      item_key: "pack_m",
      item_type: "braincell_pack",
      label: "Pack M",
      plan_code: null,
      braincells_amount: 500,
      price_eur: 4.99,
      is_active: true,
      sort_order: 40,
    },
    {
      profile_id: profileId,
      item_key: "pack_l",
      item_type: "braincell_pack",
      label: "Pack L",
      plan_code: null,
      braincells_amount: 1500,
      price_eur: 9.99,
      is_active: true,
      sort_order: 50,
    },
  ];

  return {
    profile: {
      id: profileId,
      name: status === "draft" ? "Fallback Draft Pricing" : "Fallback Active Pricing",
      status,
      effective_from: status === "active" ? new Date().toISOString() : null,
      notes: "Fallback local gerado a partir de pricing-constants.ts",
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    plans,
    features: fallbackFeatures(profileId),
    providerCosts,
    infraCosts,
    storeItems,
    source: "fallback",
  };
}

function sortBundle(bundle: PricingProfileBundle): PricingProfileBundle {
  return {
    ...bundle,
    plans: [...bundle.plans].sort((a, b) => a.label.localeCompare(b.label)),
    features: [...bundle.features].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
    providerCosts: [...bundle.providerCosts].sort((a, b) => a.label.localeCompare(b.label)),
    infraCosts: [...bundle.infraCosts].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
    storeItems: [...bundle.storeItems].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
  };
}

async function loadBundleByProfile(profile: PricingProfileRow): Promise<PricingProfileBundle | null> {
  const supabase = getSupabaseAdmin();

  const [plansRes, featuresRes, providerRes, infraRes, storeRes] = await Promise.all([
    supabase.from("ops_pricing_plan_settings").select("*").eq("profile_id", profile.id),
    supabase.from("ops_pricing_feature_settings").select("*").eq("profile_id", profile.id),
    supabase.from("ops_provider_cost_settings").select("*").eq("profile_id", profile.id),
    supabase.from("ops_infra_cost_settings").select("*").eq("profile_id", profile.id),
    supabase.from("ops_pricing_store_items").select("*").eq("profile_id", profile.id),
  ]);

  if (plansRes.error || featuresRes.error || providerRes.error || infraRes.error || storeRes.error) {
    return null;
  }

  return sortBundle({
    profile,
    plans: (plansRes.data ?? []).map((row) => ({
      ...row,
      monthly_price_eur: asNumber(row.monthly_price_eur),
      annual_price_eur: row.annual_price_eur === null ? null : asNumber(row.annual_price_eur),
      cooldown_seconds: asNumber(row.cooldown_seconds),
    })),
    features: (featuresRes.data ?? []).map((row) => ({
      ...row,
      braincells_free: asNumber(row.braincells_free),
      braincells_premium: asNumber(row.braincells_premium),
      fallback_cost_eur: asNumber(row.fallback_cost_eur),
      sort_order: asNumber(row.sort_order),
    })),
    providerCosts: (providerRes.data ?? []).map((row) => ({
      ...row,
      input_per_1m_eur: asNumber(row.input_per_1m_eur),
      output_per_1m_eur: asNumber(row.output_per_1m_eur),
      image_tile_tokens: asNumber(row.image_tile_tokens, 258),
      fallback_per_call_eur: asNumber(row.fallback_per_call_eur),
    })),
    infraCosts: (infraRes.data ?? []).map((row) => ({
      ...row,
      monthly_cost_eur: asNumber(row.monthly_cost_eur),
      sort_order: asNumber(row.sort_order),
    })),
    storeItems: (storeRes.data ?? []).map((row) => ({
      ...row,
      braincells_amount: asNumber(row.braincells_amount),
      price_eur: asNumber(row.price_eur),
      sort_order: asNumber(row.sort_order),
    })),
    source: "database",
  });
}

export async function listPricingProfiles(): Promise<PricingProfileRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ops_pricing_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data?.length) {
    return [fallbackBundle("draft").profile, fallbackBundle("active").profile];
  }

  return data;
}

export async function getPricingProfileByStatus(status: PricingProfileStatus): Promise<PricingProfileBundle> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ops_pricing_profiles")
    .select("*")
    .eq("status", status)
    .order("updated_at", { ascending: false })
    .maybeSingle<PricingProfileRow>();

  if (error || !data) {
    return fallbackBundle(status);
  }

  const bundle = await loadBundleByProfile(data);
  return bundle ?? fallbackBundle(status);
}

export async function getActivePricingProfile() {
  return getPricingProfileByStatus("active");
}

export async function getDraftPricingProfile() {
  const draft = await getPricingProfileByStatus("draft");
  if (draft.source === "fallback") {
    return draft;
  }

  return draft;
}

export async function getPricingProfileById(profileId: string): Promise<PricingProfileBundle | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ops_pricing_profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle<PricingProfileRow>();

  if (error || !data) return null;
  return loadBundleByProfile(data);
}

function buildProviderCostMap(bundle: PricingProfileBundle) {
  return new Map(bundle.providerCosts.map((row) => [row.model_key, row]));
}

function buildFeatureUnitEconomics(bundle: PricingProfileBundle): FeatureUnitEconomics[] {
  return bundle.features
    .filter((feature) => feature.is_active)
    .map((feature) => {
      const free = feature.braincells_free > 0 ? feature.fallback_cost_eur / feature.braincells_free : null;
      const premium = feature.braincells_premium > 0 ? feature.fallback_cost_eur / feature.braincells_premium : null;

      return {
        feature_key: feature.feature_key,
        label: feature.label,
        free_cost_per_braincell_eur: free,
        premium_cost_per_braincell_eur: premium,
        fallback_cost_eur: feature.fallback_cost_eur,
        provider_model: feature.provider_model,
      };
    })
    .sort((a, b) => b.fallback_cost_eur - a.fallback_cost_eur);
}

function averageBraincellCost(bundle: PricingProfileBundle, observedRows: AiCostViewRow[]) {
  const observedCosts = observedRows
    .filter((row) => row.total_braincells > 0)
    .map((row) => {
      if (row.total_input_tokens !== null && row.total_output_tokens !== null && row.model) {
        const provider = buildProviderCostMap(bundle).get(row.model);
        if (provider) {
          const exact =
            (row.total_input_tokens / 1_000_000) * provider.input_per_1m_eur +
            (row.total_output_tokens / 1_000_000) * provider.output_per_1m_eur;

          return exact / row.total_braincells;
        }
      }

      const fallbackFeature = bundle.features.find((feature) => feature.feature_key === row.action_key);
      if (fallbackFeature && row.total_braincells > 0) {
        return fallbackFeature.fallback_cost_eur / row.total_braincells;
      }

      return null;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);

  if (observedCosts.length > 0) {
    return observedCosts.reduce((sum, value) => sum + value, 0) / observedCosts.length;
  }

  const unitEconomics = buildFeatureUnitEconomics(bundle);
  const ratios = unitEconomics.flatMap((item) => [item.free_cost_per_braincell_eur, item.premium_cost_per_braincell_eur])
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);

  if (ratios.length === 0) return 0;
  return ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
}

function averagePremiumBraincellCost(bundle: PricingProfileBundle, observedRows: AiCostViewRow[]) {
  const observedAverage = averageBraincellCost(bundle, observedRows);
  const premiumRatios = buildFeatureUnitEconomics(bundle)
    .map((item) => item.premium_cost_per_braincell_eur)
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);

  if (premiumRatios.length === 0) return observedAverage;

  const premiumAverage =
    premiumRatios.reduce((sum, value) => sum + value, 0) / premiumRatios.length;

  return Math.max(observedAverage, premiumAverage);
}

function averageCostPerBraincellForAction(
  bundle: PricingProfileBundle,
  observedRows: AiCostViewRow[],
  actionKey: string,
) {
  const targetRows = observedRows.filter(
    (row) => row.action_key === actionKey && row.total_braincells > 0,
  );

  if (targetRows.length === 0) {
    const feature = bundle.features.find((item) => item.feature_key === actionKey);
    if (!feature || feature.braincells_free <= 0) return null;
    return feature.fallback_cost_eur / feature.braincells_free;
  }

  const providerCostMap = buildProviderCostMap(bundle);
  const ratios = targetRows.map((row) => {
    if (row.total_input_tokens !== null && row.total_output_tokens !== null && row.model) {
      const provider = providerCostMap.get(row.model);
      if (provider) {
        const exact =
          (row.total_input_tokens / 1_000_000) * provider.input_per_1m_eur +
          (row.total_output_tokens / 1_000_000) * provider.output_per_1m_eur;
        return exact / row.total_braincells;
      }
    }

    const feature = bundle.features.find((item) => item.feature_key === row.action_key);
    if (feature && row.total_braincells > 0) {
      return feature.fallback_cost_eur / row.total_braincells;
    }

    return null;
  }).filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);

  if (ratios.length === 0) return null;
  return ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
}

function getPlan(bundle: PricingProfileBundle, planCode: string) {
  return bundle.plans.find((plan) => plan.plan_code === planCode) ?? null;
}

export async function getPricingScenarioMetrics(status: PricingProfileStatus = "active"): Promise<PricingScenarioMetrics> {
  const bundle = await getPricingProfileByStatus(status);
  const supabase = getSupabaseAdmin();

  const [walletsRes, aiCostsRes] = await Promise.all([
    supabase.from("user_token_wallets").select("plan_code"),
    supabase.from("vw_ai_costs_by_action").select("*"),
  ]);

  const wallets = (walletsRes.data ?? []) as WalletPlanRow[];
  const aiCosts = (aiCostsRes.data ?? []) as AiCostViewRow[];
  const providerCostMap = buildProviderCostMap(bundle);
  const premiumPlan = getPlan(bundle, "premium");
  const freePlan = getPlan(bundle, "free");
  const premiumUnitRevenue = calculateSubscriptionUnitEconomics(
    premiumPlan?.monthly_price_eur ?? PREMIUM_PRICE_EUR,
    CONSERVATIVE_PREMIUM_CHANNEL_KEY,
  );

  let observedAiCostEur = 0;
  for (const row of aiCosts) {
    if (row.action_key.includes("refund")) continue;

    if (row.total_input_tokens !== null && row.total_output_tokens !== null && row.model) {
      const provider = providerCostMap.get(row.model);
      if (provider) {
        observedAiCostEur +=
          (row.total_input_tokens / 1_000_000) * provider.input_per_1m_eur +
          (row.total_output_tokens / 1_000_000) * provider.output_per_1m_eur;
        continue;
      }
    }

    const fallbackFeature = bundle.features.find((feature) => feature.feature_key === row.action_key);
    if (fallbackFeature) {
      observedAiCostEur += row.event_count * fallbackFeature.fallback_cost_eur;
      continue;
    }

    const fallbackCall = COST_PER_CALL_EUR[row.action_key];
    observedAiCostEur += row.event_count * (fallbackCall?.cost ?? 0);
  }

  const premiumUsers = wallets.filter((wallet) => wallet.plan_code === "premium").length;
  const freeUsers = wallets.filter((wallet) => wallet.plan_code === "free").length;
  const totalUsers = wallets.length;
  const monthlyRevenueEur = premiumUsers * (premiumPlan?.monthly_price_eur ?? PREMIUM_PRICE_EUR);
  const vatOnSubscriptionsEur = premiumUsers * premiumUnitRevenue.vatComponentEur;
  const storeFeesEur = premiumUsers * premiumUnitRevenue.storeFeeEur;
  const netSubscriptionRevenueEur =
    premiumUsers * premiumUnitRevenue.platformProceedsPreTaxEur;
  const infraCostMonthlyEur = bundle.infraCosts
    .filter((item) => item.is_active)
    .reduce((sum, item) => sum + item.monthly_cost_eur, 0);
  const avgCostPerBraincellEur = averageBraincellCost(bundle, aiCosts);
  const premiumCostPerBraincellEur = averagePremiumBraincellCost(bundle, aiCosts);
  const avgChatCostPerBraincellEur =
    averageCostPerBraincellForAction(bundle, aiCosts, "chat_tutor_message") ??
    avgCostPerBraincellEur;
  const freeChatWeeklyBudgetBraincells = 120;

  const freeMonthlyLiabilityEur = (freePlan?.daily_braincells ?? 0) * 30 * avgCostPerBraincellEur;
  const freeChatMonthlyLiabilityEur =
    freeChatWeeklyBudgetBraincells * (30 / 7) * avgChatCostPerBraincellEur;
  const premiumMonthlyQuotaCostEur =
    (premiumPlan?.daily_braincells ?? 0) * 30 * premiumCostPerBraincellEur;
  const premiumContributionMarginEur =
    premiumUnitRevenue.platformProceedsPreTaxEur - premiumMonthlyQuotaCostEur;
  const premiumContributionAfterTaxEur = calculateAfterTaxProfit(
    premiumContributionMarginEur,
  ).afterTaxProfitEur;
  const onePremiumCoversFreeUsers =
    freeMonthlyLiabilityEur > 0
      ? premiumContributionMarginEur / freeMonthlyLiabilityEur
      : null;
  const pretaxNetMonthlyEur =
    netSubscriptionRevenueEur - observedAiCostEur - infraCostMonthlyEur;
  const { estimatedCorporateTaxEur, afterTaxProfitEur } = calculateAfterTaxProfit(
    pretaxNetMonthlyEur,
  );

  return {
    bundle,
    observed: {
      totalUsers,
      freeUsers,
      premiumUsers,
      monthlyRevenueEur,
      vatOnSubscriptionsEur,
      storeFeesEur,
      netSubscriptionRevenueEur,
      aiCostEur30d: observedAiCostEur,
      infraCostMonthlyEur,
      pretaxNetMonthlyEur,
      estimatedCorporateTaxEur,
      netMonthlyEur: afterTaxProfitEur,
    },
    modeled: {
      avgCostPerBraincellEur,
      avgChatCostPerBraincellEur,
      premiumCostPerBraincellEur,
      freeMonthlyLiabilityEur,
      freeChatMonthlyLiabilityEur,
      freeChatWeeklyBudgetBraincells,
      premiumVatPerSubscriptionEur: premiumUnitRevenue.vatComponentEur,
      premiumStoreFeePerSubscriptionEur: premiumUnitRevenue.storeFeeEur,
      premiumNetRevenuePerSubscriptionEur:
        premiumUnitRevenue.platformProceedsPreTaxEur,
      premiumRevenueChannelLabel: premiumUnitRevenue.channelLabel,
      premiumRevenueChannelKey: premiumUnitRevenue.channelKey,
      premiumRevenueChannelFeeRate: premiumUnitRevenue.storeFeeRate,
      premiumTaxRate: PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE,
      premiumMonthlyQuotaCostEur,
      premiumContributionMarginEur,
      premiumContributionAfterTaxEur,
      onePremiumCoversFreeUsers,
    },
    unitEconomics: buildFeatureUnitEconomics(bundle),
  };
}

export function getFallbackInfraMonthlyCost() {
  return TOTAL_INFRA_MONTHLY_EUR;
}
