/**
 * Pricing constants for AI models and app plans.
 *
 * These values are used to convert internal "Braincell" token usage
 * into estimated real-money costs (EUR).
 *
 * Update these whenever API pricing changes.
 */

// ---------------------------------------------------------------------------
// Premium subscription price
// ---------------------------------------------------------------------------
export const PREMIUM_PRICE_EUR = 8.99; // per month

// ---------------------------------------------------------------------------
// Exact Model Pricing (per 1M tokens, EUR)
// Used for high-precision P&L calculations directly from API usage metadata
// ---------------------------------------------------------------------------
export const MODEL_PRICING_EUR: Record<string, { inputPer1M: number; outputPer1M: number; label: string }> = {
  // Google Models
  "gemini-2.5-flash-lite": {
    inputPer1M: 0.07,
    outputPer1M: 0.28,
    label: "Gemini 2.5 Flash Lite",
  },
  "gemini-2.5-flash": {
    inputPer1M: 0.14,
    outputPer1M: 0.55,
    label: "Gemini 2.5 Flash",
  },
  "gemini-2.0-flash-001": {
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    label: "Gemini 2.0 Flash",
  },
  // OpenAI Models
  "gpt-4o": {
    inputPer1M: 2.30,
    outputPer1M: 9.25,
    label: "GPT-4o",
  },
  "gpt-4o-mini": {
    inputPer1M: 0.14,
    outputPer1M: 0.55,
    label: "GPT-4o Mini",
  },
};

// ---------------------------------------------------------------------------
// USD → EUR conversion factor
// ---------------------------------------------------------------------------
export const USD_TO_EUR = 0.92;

// ---------------------------------------------------------------------------
// Average real-money cost per API call by feature.
//
// These are estimations based on typical prompt + completion sizes.
// Each feature's average input/output token counts were measured from
// production prompts.
//
// Formula: (avg_input_tokens / 1M × inputRate + avg_output_tokens / 1M × outputRate) × USD_TO_EUR
// ---------------------------------------------------------------------------
export const COST_PER_CALL_EUR: Record<string, { cost: number; model: string; description: string }> = {
  // --- User-Facing AI Features ---
  quick_doubt: {
    cost: 0.0012,   // ~800 in + 500 out on flash-lite
    model: "gemini-2.5-flash-lite",
    description: "Dúvida rápida (não percebi / porquê errado / porquê certo)",
  },
  advanced_explanation: {
    cost: 0.0020,   // ~1000 in + 600 out on flash-lite
    model: "gemini-2.5-flash-lite",
    description: "Explicação avançada (outro método)",
  },
  example_similar: {
    cost: 0.0018,   // ~900 in + 600 out on flash-lite
    model: "gemini-2.5-flash-lite",
    description: "Exemplo similar",
  },
  custom_doubt: {
    cost: 0.0012,   // ~800 in + 500 out on flash-lite
    model: "gemini-2.5-flash-lite",
    description: "Dúvida personalizada",
  },
  follow_up: {
    cost: 0.0010,   // ~700 in + 400 out on flash-lite
    model: "gemini-2.5-flash-lite",
    description: "Follow-up de dúvida",
  },
  chat_tutor_message: {
    cost: 0.0015,   // ~1000 in + 500 out, varies by plan
    model: "gemini-2.5-flash-lite",
    description: "Mensagem ao Chat Tutor",
  },
  grade_exam: {
    cost: 0.0040,   // ~1500 in (+ image) + 800 out on flash
    model: "gemini-2.0-flash-001",
    description: "Correção de exame (foto)",
  },
  grade_resolution: {
    cost: 0.0180,   // ~2000 in (+ image) + 500 out on GPT-4o
    model: "gpt-4o",
    description: "Correção de resolução (GPT-4o)",
  },

  // --- Internal Agent Operations ---
  agent_run_generic: {
    cost: 0.0300,   // ~3000 in + 2000 out on flash
    model: "gemini-2.5-flash",
    description: "Run de agente interno (média)",
  },
};

// ---------------------------------------------------------------------------
// Monthly infrastructure costs (fixed)
// ---------------------------------------------------------------------------
export const INFRA_COSTS_EUR: Record<string, { cost: number; description: string }> = {
  supabase: {
    cost: 0,      // Free plan
    description: "Supabase (Plano Free)",
  },
  domain: {
    cost: 0,      // No custom domain yet
    description: "Domínio",
  },
  app_store: {
    cost: 0,      // Apple Dev annual ÷ 12
    description: "Apple Developer (€99/ano ÷ 12)",
  },
};

// Convenience: total fixed infra per month
export const TOTAL_INFRA_MONTHLY_EUR = Object.values(INFRA_COSTS_EUR).reduce(
  (acc, v) => acc + v.cost, 0
);
