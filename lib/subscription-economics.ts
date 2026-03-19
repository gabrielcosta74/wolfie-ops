export const PORTUGAL_VAT_RATE = 0.23;
export const PORTUGAL_CORPORATE_INCOME_TAX_RATE = 0.19;
export const PORTUGAL_MUNICIPAL_DERRAMA_RATE = 0.015;
export const PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE =
  PORTUGAL_CORPORATE_INCOME_TAX_RATE + PORTUGAL_MUNICIPAL_DERRAMA_RATE;

export type SubscriptionChannelKey =
  | "web_direct"
  | "app_store_small_business"
  | "app_store_standard_year_one"
  | "google_play_subscription";

export const SUBSCRIPTION_CHANNELS: Record<
  SubscriptionChannelKey,
  {
    label: string;
    feeRate: number;
    note: string;
  }
> = {
  web_direct: {
    label: "Web Direct",
    feeRate: 0,
    note: "Sem comissão de loja; gateway não modelado aqui.",
  },
  app_store_small_business: {
    label: "App Store Small Business",
    feeRate: 0.15,
    note: "Programa Small Business: comissão reduzida.",
  },
  app_store_standard_year_one: {
    label: "App Store Standard (Ano 1)",
    feeRate: 0.3,
    note: "Cenário conservador para subscrição sem Small Business.",
  },
  google_play_subscription: {
    label: "Google Play Subscription",
    feeRate: 0.15,
    note: "Service fee base de subscrições.",
  },
};

export const CONSERVATIVE_PREMIUM_CHANNEL_KEY: SubscriptionChannelKey =
  "app_store_standard_year_one";

export type SubscriptionUnitEconomics = {
  grossPriceEur: number;
  vatRate: number;
  vatComponentEur: number;
  netOfVatEur: number;
  storeFeeRate: number;
  storeFeeEur: number;
  platformProceedsPreTaxEur: number;
  channelKey: SubscriptionChannelKey;
  channelLabel: string;
  channelNote: string;
};

export function calculateVatComponentFromGross(
  grossPriceEur: number,
  vatRate = PORTUGAL_VAT_RATE,
) {
  const netOfVatEur = grossPriceEur / (1 + vatRate);
  const vatComponentEur = grossPriceEur - netOfVatEur;

  return {
    netOfVatEur,
    vatComponentEur,
  };
}

export function calculateSubscriptionUnitEconomics(
  grossPriceEur: number,
  channelKey: SubscriptionChannelKey = CONSERVATIVE_PREMIUM_CHANNEL_KEY,
  vatRate = PORTUGAL_VAT_RATE,
): SubscriptionUnitEconomics {
  const channel = SUBSCRIPTION_CHANNELS[channelKey];
  const { netOfVatEur, vatComponentEur } = calculateVatComponentFromGross(
    grossPriceEur,
    vatRate,
  );
  const storeFeeEur = netOfVatEur * channel.feeRate;
  const platformProceedsPreTaxEur = netOfVatEur - storeFeeEur;

  return {
    grossPriceEur,
    vatRate,
    vatComponentEur,
    netOfVatEur,
    storeFeeRate: channel.feeRate,
    storeFeeEur,
    platformProceedsPreTaxEur,
    channelKey,
    channelLabel: channel.label,
    channelNote: channel.note,
  };
}

export function estimatePortugalProfitTax(
  pretaxProfitEur: number,
  effectiveRate = PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE,
) {
  if (pretaxProfitEur <= 0) return 0;
  return pretaxProfitEur * effectiveRate;
}

export function calculateAfterTaxProfit(
  pretaxProfitEur: number,
  effectiveRate = PORTUGAL_EFFECTIVE_PROFIT_TAX_RATE,
) {
  const estimatedCorporateTaxEur = estimatePortugalProfitTax(
    pretaxProfitEur,
    effectiveRate,
  );

  return {
    pretaxProfitEur,
    estimatedCorporateTaxEur,
    afterTaxProfitEur: pretaxProfitEur - estimatedCorporateTaxEur,
  };
}

export function buildSubscriptionChannelBenchmarks(grossPriceEur: number) {
  return (Object.keys(SUBSCRIPTION_CHANNELS) as SubscriptionChannelKey[]).map(
    (channelKey) => calculateSubscriptionUnitEconomics(grossPriceEur, channelKey),
  );
}
