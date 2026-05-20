import { describe, it, expect } from "vitest";
import {
  classifySetup,
  segmentSurcharge,
  lookupBaseFromRules,
  calcSetupPriceFromRules,
  type SegmentType,
  type PricingRow,
} from "../pricing-shared";
import { SEED_SETUP_PRICING_RULES } from "../seed-data";

describe("classifySetup", () => {
  const segments: SegmentType[] = ["mesmo", "correlato", "diferente", "muito_diferente"];

  it("returns padrao for 1 CNPJ regardless of segment", () => {
    for (const seg of segments) {
      expect(classifySetup(1, seg)).toBe("padrao");
    }
  });

  it("returns padrao for 2-5 CNPJs with mesmo segment", () => {
    for (let n = 2; n <= 5; n++) {
      expect(classifySetup(n, "mesmo")).toBe("padrao");
    }
  });

  it("returns complexo for 2-5 CNPJs with non-mesmo segments", () => {
    const nonMesmo: SegmentType[] = ["correlato", "diferente", "muito_diferente"];
    for (let n = 2; n <= 5; n++) {
      for (const seg of nonMesmo) {
        expect(classifySetup(n, seg)).toBe("complexo");
      }
    }
  });

  it("returns complexo for 6+ CNPJs even with mesmo segment", () => {
    for (let n = 6; n <= 10; n++) {
      expect(classifySetup(n, "mesmo")).toBe("complexo");
    }
  });

  it("returns complexo for 6+ CNPJs with all segment types", () => {
    for (const seg of segments) {
      expect(classifySetup(6, seg)).toBe("complexo");
      expect(classifySetup(10, seg)).toBe("complexo");
    }
  });
});

describe("segmentSurcharge", () => {
  it("returns 0 for 1 CNPJ regardless of segment", () => {
    expect(segmentSurcharge(1, "mesmo")).toBe(0);
    expect(segmentSurcharge(1, "correlato")).toBe(0);
    expect(segmentSurcharge(1, "diferente")).toBe(0);
    expect(segmentSurcharge(1, "muito_diferente")).toBe(0);
  });

  it("returns 0 for mesmo segment regardless of CNPJ count", () => {
    expect(segmentSurcharge(2, "mesmo")).toBe(0);
    expect(segmentSurcharge(5, "mesmo")).toBe(0);
    expect(segmentSurcharge(10, "mesmo")).toBe(0);
  });

  it("calculates (cnpjCount - 1) * 3000 for non-mesmo segments with >1 CNPJ", () => {
    expect(segmentSurcharge(2, "correlato")).toBe(3_000);
    expect(segmentSurcharge(3, "diferente")).toBe(6_000);
    expect(segmentSurcharge(5, "muito_diferente")).toBe(12_000);
    expect(segmentSurcharge(10, "correlato")).toBe(27_000);
  });
});

describe("lookupBaseFromRules", () => {
  const rules: PricingRow[] = [
    { min_revenue: 0, max_revenue: 100_000, price_standard: 10_000, price_complex: 15_000 },
    { min_revenue: 100_000, max_revenue: 200_000, price_standard: 12_000, price_complex: 18_000 },
    { min_revenue: 200_000, max_revenue: null, price_standard: 20_000, price_complex: 25_000 },
  ];

  it("returns 0 for empty rules", () => {
    expect(lookupBaseFromRules([], 50_000, "padrao")).toBe(0);
  });

  it("picks correct bracket for values at the start", () => {
    expect(lookupBaseFromRules(rules, 0, "padrao")).toBe(10_000);
    expect(lookupBaseFromRules(rules, 0, "complexo")).toBe(15_000);
  });

  it("picks correct bracket for values in the middle", () => {
    expect(lookupBaseFromRules(rules, 50_000, "padrao")).toBe(10_000);
    expect(lookupBaseFromRules(rules, 150_000, "padrao")).toBe(12_000);
  });

  it("picks correct bracket at boundary (max_revenue is exclusive)", () => {
    expect(lookupBaseFromRules(rules, 99_999, "padrao")).toBe(10_000);
    expect(lookupBaseFromRules(rules, 100_000, "padrao")).toBe(12_000);
  });

  it("returns last bracket for values in null max_revenue range", () => {
    expect(lookupBaseFromRules(rules, 500_000, "padrao")).toBe(20_000);
    expect(lookupBaseFromRules(rules, 999_999, "complexo")).toBe(25_000);
  });

  it("handles unsorted rules by sorting internally", () => {
    const unsorted = [...rules].reverse();
    expect(lookupBaseFromRules(unsorted, 50_000, "padrao")).toBe(10_000);
    expect(lookupBaseFromRules(unsorted, 150_000, "complexo")).toBe(18_000);
  });
});

describe("calcSetupPriceFromRules", () => {
  const rules: PricingRow[] = SEED_SETUP_PRICING_RULES.map((r) => ({
    min_revenue: r.min_revenue,
    max_revenue: r.max_revenue,
    price_standard: r.price_standard,
    price_complex: r.price_complex,
  }));

  it("returns padrao classification for 1 CNPJ", () => {
    const result = calcSetupPriceFromRules(rules, 50_000, 1, "mesmo");
    expect(result.classification).toBe("padrao");
    expect(result.base).toBe(10_000);
    expect(result.surcharge).toBe(0);
    expect(result.total).toBe(10_000);
  });

  it("returns complexo classification for multi-CNPJ non-mesmo", () => {
    const result = calcSetupPriceFromRules(rules, 50_000, 3, "diferente");
    expect(result.classification).toBe("complexo");
    expect(result.base).toBe(15_000);
    expect(result.surcharge).toBe(6_000);
    expect(result.total).toBe(21_000);
  });

  it("uses correct price bracket for high revenue", () => {
    const result = calcSetupPriceFromRules(rules, 3_000_000, 1, "mesmo");
    expect(result.base).toBe(25_000);
    expect(result.total).toBe(25_000);
  });

  it("uses highest bracket for very high revenue", () => {
    const result = calcSetupPriceFromRules(rules, 10_000_000, 2, "correlato");
    expect(result.classification).toBe("complexo");
    expect(result.base).toBe(40_000);
    expect(result.surcharge).toBe(3_000);
    expect(result.total).toBe(43_000);
  });

  it("handles boundary between brackets", () => {
    const at500k = calcSetupPriceFromRules(rules, 500_000, 1, "mesmo");
    expect(at500k.base).toBe(15_000);

    const at1M = calcSetupPriceFromRules(rules, 1_000_000, 1, "mesmo");
    expect(at1M.base).toBe(20_000);
  });
});
