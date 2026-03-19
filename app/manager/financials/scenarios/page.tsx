import Link from "next/link";
import { ArrowLeft, BarChart3, TrendingDown, TrendingUp, ShieldAlert } from "lucide-react";
import { getPricingScenarioMetrics } from "@/lib/pricing-config";
import { PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE, PORTUGAL_VAT_RATE } from "@/lib/subscription-economics";

export const dynamic = "force-dynamic";

function eur(value: number, decimals = 2) {
  return `€${value.toFixed(decimals)}`;
}

function deltaColor(value: number) {
  if (value > 0) return "var(--success)";
  if (value < 0) return "var(--danger)";
  return "var(--muted)";
}

function ScenarioCard({ title, subtitle, value, delta }: {
  title: string;
  subtitle: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="panel pad" style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
        {title}
      </span>
      <strong style={{ fontSize: "1.6rem", letterSpacing: "-0.02em" }}>{value}</strong>
      <span style={{ color: "var(--muted)" }}>{subtitle}</span>
      {delta ? <span style={{ color: "var(--info)", fontSize: "0.86rem" }}>{delta}</span> : null}
    </div>
  );
}

export default async function ScenarioSimulatorPage() {
  const [activeMetrics, draftMetrics] = await Promise.all([
    getPricingScenarioMetrics("active"),
    getPricingScenarioMetrics("draft"),
  ]);

  const deltaNet = draftMetrics.observed.netMonthlyEur - activeMetrics.observed.netMonthlyEur;
  const deltaFreeLiability = draftMetrics.modeled.freeChatMonthlyLiabilityEur - activeMetrics.modeled.freeChatMonthlyLiabilityEur;
  const deltaPremiumMargin =
    draftMetrics.modeled.premiumContributionAfterTaxEur -
    activeMetrics.modeled.premiumContributionAfterTaxEur;

  return (
    <div style={{ padding: "48px 48px", maxWidth: 1500, margin: "0 auto", width: "100%", display: "grid", gap: 28 }}>
      <header>
        <Link href="/manager/financials" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12 }}>
          <ArrowLeft size={14} /> Financeiro
        </Link>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
          Scenario Simulator
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", maxWidth: 860, lineHeight: 1.6 }}>
          Comparação entre o perfil <strong>active</strong> e o perfil <strong>draft</strong>. Esta vista existe para perceber
          o impacto económico das alterações antes de publicar pricing novo.
        </p>
      </header>

      <div className="panel pad" style={{ display: "grid", gap: 10 }}>
        <strong style={{ fontSize: "0.92rem" }}>Premissas financeiras conservadoras</strong>
        <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          As métricas de subscrição descontam IVA PT de {(PORTUGAL_VAT_RATE * 100).toFixed(0)}%, fee de loja no canal conservador
          ({activeMetrics.modeled.premiumRevenueChannelLabel}) e imposto estimado sobre lucro de {(PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE * 100).toFixed(1)}%.
        </span>
      </div>

      {(activeMetrics.bundle.source !== "database" || draftMetrics.bundle.source !== "database") ? (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 18px", background: "var(--warning-soft)", borderRadius: 14, border: "1px solid rgba(245, 158, 11, 0.22)" }}>
          <ShieldAlert size={20} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong style={{ display: "block", marginBottom: 4 }}>Simulação em modo fallback</strong>
            <span style={{ color: "var(--muted)" }}>
              Enquanto a migration de pricing não estiver aplicada, esta comparação usa defaults locais e estimativas derivadas do histórico atual.
            </span>
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18 }}>
        <ScenarioCard
          title="Active Net Pós-Imposto"
          value={eur(activeMetrics.observed.netMonthlyEur)}
          subtitle="receita líquida plataforma - IA - infra - imposto"
        />
        <ScenarioCard
          title="Draft Net Pós-Imposto"
          value={eur(draftMetrics.observed.netMonthlyEur)}
          subtitle="receita líquida plataforma - IA - infra - imposto"
          delta={`${deltaNet >= 0 ? "+" : ""}${eur(deltaNet)}`}
        />
        <ScenarioCard
          title="Free Chat Liability"
          value={eur(draftMetrics.modeled.freeChatMonthlyLiabilityEur, 4)}
          subtitle="custo máximo mensal do Explicador free"
          delta={`${deltaFreeLiability >= 0 ? "+" : ""}${eur(deltaFreeLiability, 4)} vs active`}
        />
        <ScenarioCard
          title="Premium Margin Pós-Imposto"
          value={eur(draftMetrics.modeled.premiumContributionAfterTaxEur)}
          subtitle="margem teórica por premium"
          delta={`${deltaPremiumMargin >= 0 ? "+" : ""}${eur(deltaPremiumMargin)} vs active`}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <section className="panel pad" style={{ display: "grid", gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={18} style={{ color: "var(--accent)" }} />
            Active
          </h2>

          <MetricRow label="Faturação bruta" value={eur(activeMetrics.observed.monthlyRevenueEur)} />
          <MetricRow label="IVA subscrições" value={eur(activeMetrics.observed.vatOnSubscriptionsEur)} />
          <MetricRow label="Store fees" value={eur(activeMetrics.observed.storeFeesEur)} />
          <MetricRow label="Receita líquida plataforma" value={eur(activeMetrics.observed.netSubscriptionRevenueEur)} />
          <MetricRow label="AI cost 30d" value={eur(activeMetrics.observed.aiCostEur30d)} />
          <MetricRow label="Infra mensal" value={eur(activeMetrics.observed.infraCostMonthlyEur)} />
          <MetricRow label="Resultado pré-imposto" value={eur(activeMetrics.observed.pretaxNetMonthlyEur)} />
          <MetricRow label="Imposto estimado" value={eur(activeMetrics.observed.estimatedCorporateTaxEur)} />
          <MetricRow label="Avg cost / Braincell" value={eur(activeMetrics.modeled.avgCostPerBraincellEur, 4)} />
          <MetricRow label="Free global liability" value={eur(activeMetrics.modeled.freeMonthlyLiabilityEur, 4)} />
          <MetricRow label="Free chat liability" value={eur(activeMetrics.modeled.freeChatMonthlyLiabilityEur, 4)} />
          <MetricRow label="Premium net / sub" value={eur(activeMetrics.modeled.premiumNetRevenuePerSubscriptionEur)} />
          <MetricRow label="Premium quota cost" value={eur(activeMetrics.modeled.premiumMonthlyQuotaCostEur)} />
          <MetricRow label="Premium contribution margin" value={eur(activeMetrics.modeled.premiumContributionMarginEur)} />
          <MetricRow label="Premium margin pós-imposto" value={eur(activeMetrics.modeled.premiumContributionAfterTaxEur)} />
        </section>

        <section className="panel pad" style={{ display: "grid", gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingDown size={18} style={{ color: "var(--info)" }} />
            Draft
          </h2>

          <MetricRow label="Faturação bruta" value={eur(draftMetrics.observed.monthlyRevenueEur)} />
          <MetricRow label="IVA subscrições" value={eur(draftMetrics.observed.vatOnSubscriptionsEur)} />
          <MetricRow label="Store fees" value={eur(draftMetrics.observed.storeFeesEur)} />
          <MetricRow label="Receita líquida plataforma" value={eur(draftMetrics.observed.netSubscriptionRevenueEur)} />
          <MetricRow label="AI cost 30d" value={eur(draftMetrics.observed.aiCostEur30d)} />
          <MetricRow label="Infra mensal" value={eur(draftMetrics.observed.infraCostMonthlyEur)} />
          <MetricRow label="Resultado pré-imposto" value={eur(draftMetrics.observed.pretaxNetMonthlyEur)} />
          <MetricRow label="Imposto estimado" value={eur(draftMetrics.observed.estimatedCorporateTaxEur)} />
          <MetricRow label="Avg cost / Braincell" value={eur(draftMetrics.modeled.avgCostPerBraincellEur, 4)} />
          <MetricRow label="Free global liability" value={eur(draftMetrics.modeled.freeMonthlyLiabilityEur, 4)} />
          <MetricRow label="Free chat liability" value={eur(draftMetrics.modeled.freeChatMonthlyLiabilityEur, 4)} />
          <MetricRow label="Premium net / sub" value={eur(draftMetrics.modeled.premiumNetRevenuePerSubscriptionEur)} />
          <MetricRow label="Premium quota cost" value={eur(draftMetrics.modeled.premiumMonthlyQuotaCostEur)} />
          <MetricRow label="Premium contribution margin" value={eur(draftMetrics.modeled.premiumContributionMarginEur)} />
          <MetricRow label="Premium margin pós-imposto" value={eur(draftMetrics.modeled.premiumContributionAfterTaxEur)} />
        </section>
      </div>

      <section className="panel pad" style={{ display: "grid", gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={18} style={{ color: "var(--accent)" }} />
          Unit Economics by Feature
        </h2>

        <div className="table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Model</th>
                <th style={{ textAlign: "right" }}>Fallback € / call</th>
                <th style={{ textAlign: "right" }}>Free € / Braincell</th>
                <th style={{ textAlign: "right" }}>Premium € / Braincell</th>
              </tr>
            </thead>
            <tbody>
              {draftMetrics.unitEconomics.map((item) => (
                <tr key={item.feature_key}>
                  <td style={{ fontWeight: 600 }}>{item.label}</td>
                  <td>{item.provider_model ?? "—"}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(item.fallback_cost_eur, 4)}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: deltaColor(-(item.free_cost_per_braincell_eur ?? 0)) }}>
                    {item.free_cost_per_braincell_eur == null ? "—" : eur(item.free_cost_per_braincell_eur, 4)}
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: deltaColor(-(item.premium_cost_per_braincell_eur ?? 0)) }}>
                    {item.premium_cost_per_braincell_eur == null ? "—" : eur(item.premium_cost_per_braincell_eur, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <strong style={{ fontVariantNumeric: "tabular-nums" }}>{value}</strong>
    </div>
  );
}
