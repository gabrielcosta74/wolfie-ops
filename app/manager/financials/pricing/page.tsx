import Link from "next/link";
import { ArrowLeft, ShieldAlert, RefreshCw, Coins, ImageIcon, Zap, Database, Layers3, Upload, RotateCcw } from "lucide-react";
import {
  getActivePricingProfile,
  getDraftPricingProfile,
  getPricingScenarioMetrics,
  listPricingProfiles,
  type InfraCostSettingRow,
  type PricingFeatureSettingRow,
  type PricingPlanSettingRow,
  type PricingStoreItemRow,
  type ProviderCostSettingRow,
} from "@/lib/pricing-config";
import {
  publishDraftPricing,
  rollbackPricingProfile,
  resetDraftFromActive,
  saveFeatureSetting,
  saveInfraCostSetting,
  savePlanSetting,
  saveProviderCostSetting,
  saveStoreItem,
} from "./actions";

export const dynamic = "force-dynamic";

function eur(value: number | null | undefined, decimals = 2) {
  if (value == null) return "—";
  return `€${value.toFixed(decimals)}`;
}

function numberValue(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

function compareValue(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

function getFeatureComparisonMap(features: PricingFeatureSettingRow[]) {
  return new Map(features.map((feature) => [feature.feature_key, feature]));
}

function getPlanComparisonMap(plans: PricingPlanSettingRow[]) {
  return new Map(plans.map((plan) => [plan.plan_code, plan]));
}

function getProviderComparisonMap(providerCosts: ProviderCostSettingRow[]) {
  return new Map(providerCosts.map((row) => [row.model_key, row]));
}

function getInfraComparisonMap(infraCosts: InfraCostSettingRow[]) {
  return new Map(infraCosts.map((row) => [row.cost_key, row]));
}

function getStoreComparisonMap(storeItems: PricingStoreItemRow[]) {
  return new Map(storeItems.map((row) => [row.item_key, row]));
}

function SaveButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        height: 36,
        borderRadius: 10,
        border: "1px solid var(--line-strong)",
        background: disabled ? "var(--surface-raised)" : "var(--accent)",
        color: disabled ? "var(--muted)" : "#fff",
        fontWeight: 700,
        padding: "0 14px",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      Guardar
    </button>
  );
}

function SectionCard({ title, subtitle, icon, children }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel pad" style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--accent)" }}>{icon}</span>
            {title}
          </h2>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "0.92rem" }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PricingInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        height: 38,
        background: "var(--bg-subtle)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        color: "var(--text)",
        padding: "0 10px",
      }}
    />
  );
}

function PricingTextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 74,
        background: "var(--bg-subtle)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        color: "var(--text)",
        padding: "10px 12px",
        resize: "vertical",
      }}
    />
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "0.74rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
      {children}
    </span>
  );
}

export default async function PricingPage() {
  const [draft, active, draftMetrics, profiles] = await Promise.all([
    getDraftPricingProfile(),
    getActivePricingProfile(),
    getPricingScenarioMetrics("draft"),
    listPricingProfiles(),
  ]);

  const editingDisabled = draft.source !== "database";
  const latestArchivedProfile = profiles.find((profile) => profile.status === "archived") ?? null;
  const activePlans = getPlanComparisonMap(active.plans);
  const activeFeatures = getFeatureComparisonMap(active.features);
  const activeProviders = getProviderComparisonMap(active.providerCosts);
  const activeInfra = getInfraComparisonMap(active.infraCosts);
  const activeStore = getStoreComparisonMap(active.storeItems);

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1500, margin: "0 auto", width: "100%", display: "grid", gap: 28 }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
        <div>
          <Link href="/manager/financials" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12 }}>
            <ArrowLeft size={14} /> Financeiro
          </Link>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
            Pricing & Limits
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: 820, lineHeight: 1.6 }}>
            Editor operacional do pricing do Wolfie. Tudo aqui trabalha sobre o perfil <strong>draft</strong>.
            O perfil <strong>active</strong> serve de comparação e continua a ser a referência do produto em runtime.
          </p>
        </div>

        <div style={{ display: "grid", gap: 10, minWidth: 320 }}>
          <div className="panel pad" style={{ display: "grid", gap: 10 }}>
            <div>
              <SmallLabel>Publish Controls</SmallLabel>
              <div style={{ color: "var(--muted)", fontSize: "0.84rem", marginTop: 6 }}>
                Publish promove o draft a active e cria um novo draft clonado do perfil publicado.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <form action={publishDraftPricing}>
                <button
                  type="submit"
                  disabled={editingDisabled}
                  style={{
                    height: 40,
                    borderRadius: 12,
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    background: editingDisabled ? "var(--surface-raised)" : "rgba(16, 185, 129, 0.14)",
                    color: editingDisabled ? "var(--muted)" : "var(--success)",
                    padding: "0 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: editingDisabled ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  <Upload size={16} />
                  Publish Draft
                </button>
              </form>

              <form action={resetDraftFromActive}>
                <button
                  type="submit"
                  disabled={editingDisabled}
                  style={{
                    height: 40,
                    borderRadius: 12,
                    border: "1px solid var(--line-strong)",
                    background: editingDisabled ? "var(--surface-raised)" : "transparent",
                    color: editingDisabled ? "var(--muted)" : "var(--text)",
                    padding: "0 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: editingDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  <RefreshCw size={16} />
                  Reset Draft
                </button>
              </form>
            </div>
          </div>

          <div className="panel pad" style={{ display: "grid", gap: 10 }}>
            <div>
              <SmallLabel>Rollback</SmallLabel>
              <div style={{ color: "var(--muted)", fontSize: "0.84rem", marginTop: 6 }}>
                {latestArchivedProfile
                  ? `Último snapshot: ${latestArchivedProfile.name} · ${new Date(latestArchivedProfile.updated_at).toLocaleString("pt-PT")}`
                  : "Ainda não existe snapshot archived para rollback."}
              </div>
            </div>

            <form action={rollbackPricingProfile}>
              <input type="hidden" name="target_profile_id" value={latestArchivedProfile?.id ?? ""} />
              <button
                type="submit"
                disabled={editingDisabled || !latestArchivedProfile}
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  background: editingDisabled || !latestArchivedProfile ? "var(--surface-raised)" : "rgba(245, 158, 11, 0.12)",
                  color: editingDisabled || !latestArchivedProfile ? "var(--muted)" : "var(--warning)",
                  padding: "0 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: editingDisabled || !latestArchivedProfile ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                <RotateCcw size={16} />
                Rollback to Latest Archived
              </button>
            </form>
          </div>
        </div>
      </header>

      {editingDisabled ? (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 18px", background: "var(--warning-soft)", borderRadius: 14, border: "1px solid rgba(245, 158, 11, 0.22)" }}>
          <ShieldAlert size={20} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong style={{ display: "block", marginBottom: 4 }}>Pricing em modo fallback</strong>
            <span style={{ color: "var(--muted)" }}>
              A migration do schema de pricing ainda não foi aplicada na base real. O Ops está a mostrar defaults locais e a edição fica bloqueada até existir fonte de verdade em DB.
            </span>
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18 }}>
        <div className="panel pad" style={{ display: "grid", gap: 8 }}>
          <SmallLabel>Draft Source</SmallLabel>
          <strong style={{ fontSize: "1.4rem" }}>{draft.source === "database" ? "Database" : "Fallback"}</strong>
          <span style={{ color: "var(--muted)" }}>{draft.profile.name}</span>
        </div>
        <div className="panel pad" style={{ display: "grid", gap: 8 }}>
          <SmallLabel>Observed Revenue</SmallLabel>
          <strong style={{ fontSize: "1.4rem" }}>{eur(draftMetrics.observed.monthlyRevenueEur)}</strong>
          <span style={{ color: "var(--muted)" }}>{draftMetrics.observed.premiumUsers} premium</span>
        </div>
        <div className="panel pad" style={{ display: "grid", gap: 8 }}>
          <SmallLabel>Observed AI Cost</SmallLabel>
          <strong style={{ fontSize: "1.4rem" }}>{eur(draftMetrics.observed.aiCostEur30d)}</strong>
          <span style={{ color: "var(--muted)" }}>últimos 30 dias</span>
        </div>
        <div className="panel pad" style={{ display: "grid", gap: 8 }}>
          <SmallLabel>Free Chat Liability</SmallLabel>
          <strong style={{ fontSize: "1.4rem" }}>{eur(draftMetrics.modeled.freeChatMonthlyLiabilityEur, 4)}</strong>
          <span style={{ color: "var(--muted)" }}>
            {`Explicador free · ${draftMetrics.modeled.freeChatWeeklyBudgetBraincells ?? 0} Braincells / 7 dias`}
          </span>
        </div>
      </div>

      <div className="panel pad" style={{ display: "grid", gap: 10 }}>
        <SmallLabel>Nota</SmallLabel>
        <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          O valor de <strong>Free Chat Liability</strong> mede apenas o teto do Explicador. O plano free global da app continua a ter uma liability separada,
          porque a wallet diária ainda cobre outras superfícies além do chat.
        </span>
      </div>

      <SectionCard
        title="Planos"
        subtitle="Quota diária, carryover, limites de imagem e rate limits por plano."
        icon={<Coins size={18} />}
      >
        <div style={{ display: "grid", gap: 16 }}>
          {draft.plans.map((plan) => {
            const activePlan = activePlans.get(plan.plan_code);
            return (
              <form key={plan.plan_code} action={savePlanSetting} className="panel" style={{ padding: 18, display: "grid", gap: 14 }}>
                <input type="hidden" name="profile_id" value={draft.profile.id} />
                <input type="hidden" name="plan_code" value={plan.plan_code} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "1rem" }}>{plan.label}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "0.84rem", marginTop: 4 }}>
                      Active: preço {eur(activePlan?.monthly_price_eur)} · diário {compareValue(activePlan?.daily_braincells)} · imagens/dia {compareValue(activePlan?.image_daily_limit)}
                    </div>
                  </div>
                  <SaveButton disabled={editingDisabled} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
                  <div><SmallLabel>Label</SmallLabel><PricingInput name="label" defaultValue={plan.label} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Preço Mensal</SmallLabel><PricingInput name="monthly_price_eur" type="number" step="0.01" defaultValue={numberValue(plan.monthly_price_eur)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Preço Anual</SmallLabel><PricingInput name="annual_price_eur" type="number" step="0.01" defaultValue={numberValue(plan.annual_price_eur)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Braincells/dia</SmallLabel><PricingInput name="daily_braincells" type="number" defaultValue={numberValue(plan.daily_braincells)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Carryover</SmallLabel><PricingInput name="carryover_limit" type="number" defaultValue={numberValue(plan.carryover_limit)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Monthly quota</SmallLabel><PricingInput name="monthly_braincells" type="number" defaultValue={numberValue(plan.monthly_braincells)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Imagens/dia</SmallLabel><PricingInput name="image_daily_limit" type="number" defaultValue={numberValue(plan.image_daily_limit)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Imagens/semana</SmallLabel><PricingInput name="image_weekly_limit" type="number" defaultValue={numberValue(plan.image_weekly_limit)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Msgs / 10m</SmallLabel><PricingInput name="message_rate_limit_10m" type="number" defaultValue={numberValue(plan.message_rate_limit_10m)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Cooldown (s)</SmallLabel><PricingInput name="cooldown_seconds" type="number" step="0.1" defaultValue={numberValue(plan.cooldown_seconds)} disabled={editingDisabled} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  <div><SmallLabel>Notas</SmallLabel><PricingTextArea name="notes" defaultValue={plan.notes ?? ""} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Razão da alteração</SmallLabel><PricingTextArea name="reason" placeholder="Ex.: reduzir risco do free image abuse" disabled={editingDisabled} /></div>
                </div>
              </form>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Custos por Feature"
        subtitle="Definição do custo em Braincells e dos guardrails por feature da app."
        icon={<Zap size={18} />}
      >
        <div style={{ display: "grid", gap: 14 }}>
          {draft.features.map((feature) => {
            const activeFeature = activeFeatures.get(feature.feature_key);
            return (
              <form key={feature.feature_key} action={saveFeatureSetting} className="panel" style={{ padding: 18, display: "grid", gap: 14 }}>
                <input type="hidden" name="profile_id" value={draft.profile.id} />
                <input type="hidden" name="feature_key" value={feature.feature_key} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "1rem" }}>{feature.label}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "0.84rem", marginTop: 4 }}>
                      {feature.surface_key} · active free/premium {compareValue(activeFeature?.braincells_free)}/{compareValue(activeFeature?.braincells_premium)} · model {compareValue(activeFeature?.provider_model)}
                    </div>
                  </div>
                  <SaveButton disabled={editingDisabled} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
                  <div><SmallLabel>Label</SmallLabel><PricingInput name="label" defaultValue={feature.label} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Free</SmallLabel><PricingInput name="braincells_free" type="number" defaultValue={numberValue(feature.braincells_free)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Premium</SmallLabel><PricingInput name="braincells_premium" type="number" defaultValue={numberValue(feature.braincells_premium)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Free / dia</SmallLabel><PricingInput name="free_daily_limit" type="number" defaultValue={numberValue(feature.free_daily_limit)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Premium / dia</SmallLabel><PricingInput name="premium_daily_limit" type="number" defaultValue={numberValue(feature.premium_daily_limit)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Provider model</SmallLabel><PricingInput name="provider_model" defaultValue={feature.provider_model ?? ""} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Free / semana</SmallLabel><PricingInput name="free_weekly_limit" type="number" defaultValue={numberValue(feature.free_weekly_limit)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Premium / semana</SmallLabel><PricingInput name="premium_weekly_limit" type="number" defaultValue={numberValue(feature.premium_weekly_limit)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Fallback € / call</SmallLabel><PricingInput name="fallback_cost_eur" type="number" step="0.0001" defaultValue={numberValue(feature.fallback_cost_eur)} disabled={editingDisabled} /></div>
                  <div style={{ display: "flex", alignItems: "end" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                      <input type="checkbox" name="is_active" defaultChecked={feature.is_active} disabled={editingDisabled} />
                      Ativa
                    </label>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  <div><SmallLabel>Descrição</SmallLabel><PricingTextArea name="description" defaultValue={feature.description ?? ""} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Razão da alteração</SmallLabel><PricingTextArea name="reason" placeholder="Ex.: subir custo da imagem no free" disabled={editingDisabled} /></div>
                </div>
              </form>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Provider Costs"
        subtitle="Assumptions operacionais por modelo para cálculo de P&L e projeções."
        icon={<Database size={18} />}
      >
        <div style={{ display: "grid", gap: 14 }}>
          {draft.providerCosts.map((provider) => {
            const activeProvider = activeProviders.get(provider.model_key);
            return (
              <form key={provider.model_key} action={saveProviderCostSetting} className="panel" style={{ padding: 18, display: "grid", gap: 14 }}>
                <input type="hidden" name="profile_id" value={draft.profile.id} />
                <input type="hidden" name="model_key" value={provider.model_key} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "1rem" }}>{provider.label}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "0.84rem", marginTop: 4 }}>
                      Active input/output {compareValue(activeProvider?.input_per_1m_eur)}/{compareValue(activeProvider?.output_per_1m_eur)} · fallback {compareValue(activeProvider?.fallback_per_call_eur)}
                    </div>
                  </div>
                  <SaveButton disabled={editingDisabled} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
                  <div><SmallLabel>Label</SmallLabel><PricingInput name="label" defaultValue={provider.label} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Input / 1M</SmallLabel><PricingInput name="input_per_1m_eur" type="number" step="0.0001" defaultValue={numberValue(provider.input_per_1m_eur)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Output / 1M</SmallLabel><PricingInput name="output_per_1m_eur" type="number" step="0.0001" defaultValue={numberValue(provider.output_per_1m_eur)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Image tiles</SmallLabel><PricingInput name="image_tile_tokens" type="number" defaultValue={numberValue(provider.image_tile_tokens)} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Fallback € / call</SmallLabel><PricingInput name="fallback_per_call_eur" type="number" step="0.0001" defaultValue={numberValue(provider.fallback_per_call_eur)} disabled={editingDisabled} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                  <div><SmallLabel>Notas</SmallLabel><PricingTextArea name="notes" defaultValue={provider.notes ?? ""} disabled={editingDisabled} /></div>
                  <div><SmallLabel>Razão da alteração</SmallLabel><PricingTextArea name="reason" placeholder="Ex.: atualizar pricing oficial Gemini" disabled={editingDisabled} /></div>
                </div>
              </form>
            );
          })}
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
        <SectionCard
          title="Store & Plans"
          subtitle="Itens comerciais vendidos ao utilizador."
          icon={<Layers3 size={18} />}
        >
          <div style={{ display: "grid", gap: 14 }}>
            {draft.storeItems.map((item) => {
              const activeItem = activeStore.get(item.item_key);
              return (
                <form key={item.item_key} action={saveStoreItem} className="panel" style={{ padding: 18, display: "grid", gap: 14 }}>
                  <input type="hidden" name="profile_id" value={draft.profile.id} />
                  <input type="hidden" name="item_key" value={item.item_key} />
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "1rem" }}>{item.label}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.84rem", marginTop: 4 }}>
                        {item.item_type} · active preço {eur(activeItem?.price_eur)} · amount {compareValue(activeItem?.braincells_amount)}
                      </div>
                    </div>
                    <SaveButton disabled={editingDisabled} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
                    <div><SmallLabel>Label</SmallLabel><PricingInput name="label" defaultValue={item.label} disabled={editingDisabled} /></div>
                    <div><SmallLabel>Preço</SmallLabel><PricingInput name="price_eur" type="number" step="0.01" defaultValue={numberValue(item.price_eur)} disabled={editingDisabled} /></div>
                    <div><SmallLabel>Braincells</SmallLabel><PricingInput name="braincells_amount" type="number" defaultValue={numberValue(item.braincells_amount)} disabled={editingDisabled} /></div>
                    <div style={{ display: "flex", alignItems: "end" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                        <input type="checkbox" name="is_active" defaultChecked={item.is_active} disabled={editingDisabled} />
                        Ativo
                      </label>
                    </div>
                  </div>

                  <div><SmallLabel>Razão da alteração</SmallLabel><PricingTextArea name="reason" placeholder="Ex.: ajustar valor percebido do pack" disabled={editingDisabled} /></div>
                </form>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Infra & Guardrails"
          subtitle="Custos fixos e riscos de abuso que alimentam o P&L."
          icon={<ImageIcon size={18} />}
        >
          <div style={{ display: "grid", gap: 14 }}>
            {draft.infraCosts.map((item: InfraCostSettingRow) => {
              const activeItem = activeInfra.get(item.cost_key);
              return (
                <form key={item.cost_key} action={saveInfraCostSetting} className="panel" style={{ padding: 18, display: "grid", gap: 14 }}>
                  <input type="hidden" name="profile_id" value={draft.profile.id} />
                  <input type="hidden" name="cost_key" value={item.cost_key} />
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "1rem" }}>{item.label}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.84rem", marginTop: 4 }}>
                        Active mensal {eur(activeItem?.monthly_cost_eur)}
                      </div>
                    </div>
                    <SaveButton disabled={editingDisabled} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <div><SmallLabel>Label</SmallLabel><PricingInput name="label" defaultValue={item.label} disabled={editingDisabled} /></div>
                    <div><SmallLabel>Custo mensal €</SmallLabel><PricingInput name="monthly_cost_eur" type="number" step="0.01" defaultValue={numberValue(item.monthly_cost_eur)} disabled={editingDisabled} /></div>
                    <div style={{ display: "flex", alignItems: "end" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                        <input type="checkbox" name="is_active" defaultChecked={item.is_active} disabled={editingDisabled} />
                        Ativo
                      </label>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <div><SmallLabel>Notas</SmallLabel><PricingTextArea name="notes" defaultValue={item.notes ?? ""} disabled={editingDisabled} /></div>
                    <div><SmallLabel>Razão da alteração</SmallLabel><PricingTextArea name="reason" placeholder="Ex.: passou a existir custo real de domínio" disabled={editingDisabled} /></div>
                  </div>
                </form>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
