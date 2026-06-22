import { describe, it, expect } from "vitest";
import { SEED_TURNAROUND_PRICING_RULES, SEED_TURNAROUND_SETTINGS } from "../seed-data";
import type { TurnaroundRule } from "@/hooks/use-pricing";

const FLOOR = 11570;

function lookupTier(rules: TurnaroundRule[], monthlyRevenue: number): TurnaroundRule {
  const sorted = [...rules].sort((a, b) => a.sort_order - b.sort_order);
  for (const r of sorted) {
    if (r.max_revenue === null || monthlyRevenue < Number(r.max_revenue)) return r;
  }
  return sorted[sorted.length - 1];
}

function calcFinal(monthlyRevenue: number, cnpjCount: number, discountPercent: number): number {
  const tier = lookupTier(SEED_TURNAROUND_PRICING_RULES, monthlyRevenue);
  const adjust = SEED_TURNAROUND_SETTINGS[0].cnpj_adjustment;
  const valorMensal = tier.base_price + (cnpjCount - 1) * adjust;
  return Math.max(FLOOR, valorMensal * (1 - discountPercent / 100));
}

describe("Turnaround seed matrix", () => {
  it("uses R$ 11.570 as the contractual floor in settings", () => {
    expect(SEED_TURNAROUND_SETTINGS[0].min_price).toBe(FLOOR);
  });

  it("anchors the 200k–500k bracket at R$ 12.570 (proposal example)", () => {
    expect(lookupTier(SEED_TURNAROUND_PRICING_RULES, 300_000).base_price).toBe(12570);
  });

  it("never prices a bracket below the floor", () => {
    for (const r of SEED_TURNAROUND_PRICING_RULES) {
      expect(r.base_price).toBeGreaterThanOrEqual(FLOOR);
    }
  });

  it("is monotonically non-decreasing by revenue", () => {
    const sorted = [...SEED_TURNAROUND_PRICING_RULES].sort((a, b) => a.sort_order - b.sort_order);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].base_price).toBeGreaterThanOrEqual(sorted[i - 1].base_price);
    }
  });
});

describe("Turnaround final price", () => {
  it("keeps the floor even with the 15% meeting discount", () => {
    // 0–200k base = 11570; 15% off would drop below floor → clamped to 11570
    expect(calcFinal(100_000, 1, 15)).toBe(FLOOR);
  });

  it("applies discount when it stays above the floor", () => {
    // 1M–2.5M base = 17000; 7% off = 15810 > floor
    expect(calcFinal(1_500_000, 1, 7)).toBeCloseTo(17000 * 0.93, 2);
  });

  it("adds R$ 500 per additional CNPJ before discount", () => {
    // 200k–500k base = 12570; +2 CNPJs = +1000 → 13570, no discount
    expect(calcFinal(300_000, 3, 0)).toBe(13570);
  });

  it("never returns below the floor for any bracket at max discount", () => {
    for (const r of SEED_TURNAROUND_PRICING_RULES) {
      const rev = r.min_revenue + 1;
      expect(calcFinal(rev, 1, 15)).toBeGreaterThanOrEqual(FLOOR);
    }
  });
});
