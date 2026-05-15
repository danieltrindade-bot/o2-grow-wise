export type SegmentType = "mesmo" | "correlato" | "diferente" | "muito_diferente";
export type Classification = "padrao" | "complexo";

interface Tier {
  max: number;
  padrao: number;
  complexo: number;
}

const SHARED_TIERS_MONTHLY: Tier[] = [
  { max: 100_000, padrao: 10_000, complexo: 15_000 },
  { max: 200_000, padrao: 10_000, complexo: 15_000 },
  { max: 350_000, padrao: 10_000, complexo: 15_000 },
  { max: 500_000, padrao: 15_000, complexo: 15_000 },
  { max: 1_000_000, padrao: 15_000, complexo: 20_000 },
  { max: 2_500_000, padrao: 20_000, complexo: 25_000 },
  { max: 5_000_000, padrao: 25_000, complexo: 30_000 },
  { max: Infinity, padrao: 35_000, complexo: 40_000 },
];

export function classifySetup(cnpjCount: number, segmentType: SegmentType): Classification {
  if (cnpjCount === 1) return "padrao";
  if (cnpjCount >= 2 && cnpjCount <= 5 && segmentType === "mesmo") return "padrao";
  return "complexo";
}

export function lookupSharedBase(monthlyRevenue: number, classification: Classification): number {
  for (const t of SHARED_TIERS_MONTHLY) {
    if (monthlyRevenue < t.max) return t[classification];
  }
  const last = SHARED_TIERS_MONTHLY[SHARED_TIERS_MONTHLY.length - 1];
  return last[classification];
}

export function segmentSurcharge(cnpjCount: number, segmentType: SegmentType): number {
  if (segmentType !== "mesmo" && cnpjCount > 1) return (cnpjCount - 1) * 3_000;
  return 0;
}

export interface SetupResult {
  classification: Classification;
  base: number;
  surcharge: number;
  total: number;
}

export function calcSetupPrice(
  monthlyRevenue: number,
  cnpjCount: number,
  segmentType: SegmentType,
): SetupResult {
  const classification = classifySetup(cnpjCount, segmentType);
  const base = lookupSharedBase(monthlyRevenue, classification);
  const surcharge = segmentSurcharge(cnpjCount, segmentType);
  return { classification, base, surcharge, total: base + surcharge };
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
