import { describe, it, expect } from "vitest";
import { calcValuation, getValuationTier, VALUATION_FLOOR } from "../valuation-pricing";

describe("Valuation pricing", () => {
  it.each([
    [0, 18000],
    [500_000, 18000],
    [500_001, 22000],
    [1_000_000, 22000],
    [1_010_000, 28000],
    [5_000_000, 28000],
    [5_000_001, 32000],
  ])("faturamento mensal %d → R$ %d", (revenue, price) => {
    expect(getValuationTier(revenue).price).toBe(price);
  });

  it("inclui até 2 CNPJs sem adicional", () => {
    expect(calcValuation(300_000, 1, 0).total).toBe(18000);
    expect(calcValuation(300_000, 2, 0).total).toBe(18000);
  });

  it("cobra R$ 1.500 por CNPJ a partir do 3º", () => {
    const q = calcValuation(300_000, 4, 0);
    expect(q.extraCnpjs).toBe(2);
    expect(q.cnpjAdjustment).toBe(3000);
    expect(q.total).toBe(21000);
  });

  it("aplica 15% de desconto de fechamento sobre o subtotal", () => {
    expect(calcValuation(2_000_000, 3, 15).total).toBeCloseTo((28000 + 1500) * 0.85);
  });

  it("nunca fica abaixo do piso de R$ 15.000", () => {
    const q = calcValuation(300_000, 1, 20);
    expect(q.total).toBe(VALUATION_FLOOR);
    expect(q.atFloor).toBe(true);
    expect(calcValuation(300_000, 1, 15).atFloor).toBe(false);
  });
});
