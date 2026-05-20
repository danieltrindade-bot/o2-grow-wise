export type SegmentType = "mesmo" | "correlato" | "diferente" | "muito_diferente";
export type Classification = "padrao" | "complexo";

export function classifySetup(cnpjCount: number, segmentType: SegmentType): Classification {
  if (cnpjCount === 1) return "padrao";
  if (cnpjCount >= 2 && cnpjCount <= 5 && segmentType === "mesmo") return "padrao";
  return "complexo";
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

export interface PricingRow {
  min_revenue: number;
  max_revenue: number | null;
  price_standard: number;
  price_complex: number;
}

export function lookupBaseFromRules(
  rules: PricingRow[],
  monthlyRevenue: number,
  classification: Classification,
): number {
  if (!rules.length) return 0;
  const sorted = [...rules].sort((a, b) => a.min_revenue - b.min_revenue);
  for (const r of sorted) {
    if (r.max_revenue === null || monthlyRevenue < Number(r.max_revenue)) {
      return Number(classification === "padrao" ? r.price_standard : r.price_complex);
    }
  }
  const last = sorted[sorted.length - 1];
  return Number(classification === "padrao" ? last.price_standard : last.price_complex);
}

export function calcSetupPriceFromRules(
  rules: PricingRow[],
  monthlyRevenue: number,
  cnpjCount: number,
  segmentType: SegmentType,
): SetupResult {
  const classification = classifySetup(cnpjCount, segmentType);
  const base = lookupBaseFromRules(rules, monthlyRevenue, classification);
  const surcharge = segmentSurcharge(cnpjCount, segmentType);
  return { classification, base, surcharge, total: base + surcharge };
}

export { formatBRL } from "./format";
