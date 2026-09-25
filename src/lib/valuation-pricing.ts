export interface ValuationTier {
  label: string;
  maxRevenue: number;
  price: number;
}

export const VALUATION_TIERS: ValuationTier[] = [
  { label: "Até R$ 500 mil", maxRevenue: 500_000, price: 18000 },
  { label: "R$ 501 mil a R$ 1 mi", maxRevenue: 1_000_000, price: 22000 },
  { label: "R$ 1,01 mi a R$ 5 mi", maxRevenue: 5_000_000, price: 28000 },
  { label: "Acima de R$ 5 mi", maxRevenue: Infinity, price: 32000 },
];

export const VALUATION_FLOOR = 15000;
// Até 2 CNPJs estão inclusos no preço da faixa; a partir do 3º, +R$ 1.500 por CNPJ.
export const VALUATION_CNPJ_INCLUDED = 2;
export const VALUATION_CNPJ_ADDITIONAL = 1500;

export function getValuationTier(monthlyRevenue: number): ValuationTier {
  return VALUATION_TIERS.find((t) => monthlyRevenue <= t.maxRevenue) ?? VALUATION_TIERS[VALUATION_TIERS.length - 1];
}

export interface ValuationQuote {
  tier: ValuationTier;
  extraCnpjs: number;
  cnpjAdjustment: number;
  subtotal: number;
  discountValue: number;
  total: number;
  atFloor: boolean;
}

export function calcValuation(monthlyRevenue: number, cnpjCount: number, discountPercent: number): ValuationQuote {
  const tier = getValuationTier(monthlyRevenue);
  const extraCnpjs = Math.max(0, cnpjCount - VALUATION_CNPJ_INCLUDED);
  const cnpjAdjustment = extraCnpjs * VALUATION_CNPJ_ADDITIONAL;
  const subtotal = tier.price + cnpjAdjustment;
  const discounted = subtotal * (1 - discountPercent / 100);
  const total = Math.max(VALUATION_FLOOR, discounted);
  return {
    tier,
    extraCnpjs,
    cnpjAdjustment,
    subtotal,
    discountValue: subtotal - discounted,
    total,
    atFloor: discounted < VALUATION_FLOOR,
  };
}
