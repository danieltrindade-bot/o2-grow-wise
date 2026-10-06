import { describe, it, expect } from "vitest";
import { lucroRealNet, LUCRO_REAL_RATE } from "@/components/LucroRealPanel";

describe("lucroRealNet", () => {
  it("abate 34% de IRPJ/CSLL do valor cobrado", () => {
    expect(LUCRO_REAL_RATE).toBe(0.34);
    expect(lucroRealNet(15000)).toBeCloseTo(9900);
  });

  it("retorna zero para valor zero", () => {
    expect(lucroRealNet(0)).toBe(0);
  });
});
