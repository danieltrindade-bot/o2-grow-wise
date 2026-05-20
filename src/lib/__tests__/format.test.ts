import { describe, it, expect } from "vitest";
import { formatBRL, formatDateBR } from "../format";

describe("formatBRL", () => {
  it("formats zero", () => {
    const result = formatBRL(0);
    expect(result).toContain("0,00");
    expect(result).toContain("R$");
  });

  it("formats positive integer", () => {
    const result = formatBRL(1500);
    expect(result).toContain("1.500,00");
  });

  it("formats positive decimal", () => {
    const result = formatBRL(1234.56);
    expect(result).toContain("1.234,56");
  });

  it("formats negative value", () => {
    const result = formatBRL(-500);
    expect(result).toContain("500,00");
  });

  it("formats large number", () => {
    const result = formatBRL(1_000_000);
    expect(result).toContain("1.000.000,00");
  });

  it("formats small decimal", () => {
    const result = formatBRL(0.99);
    expect(result).toContain("0,99");
  });
});

describe("formatDateBR", () => {
  it("converts ISO date to BR format", () => {
    expect(formatDateBR("2024-03-15")).toBe("15/03/2024");
  });

  it("returns empty string for empty input", () => {
    expect(formatDateBR("")).toBe("");
  });

  it("handles single digit day and month", () => {
    expect(formatDateBR("2024-01-05")).toBe("05/01/2024");
  });

  it("handles end of year", () => {
    expect(formatDateBR("2024-12-31")).toBe("31/12/2024");
  });

  it("handles beginning of year", () => {
    expect(formatDateBR("2024-01-01")).toBe("01/01/2024");
  });
});
