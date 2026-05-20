import { describe, it, expect } from "vitest";
import {
  calcGrade,
  getMaturity,
  buildCostRows,
  buildOutcomeRows,
  buildAlerts,
  getRecommendation,
} from "../results-logic";
import type { TrafficLight } from "@/context/DiagnosticContext";
import {
  SEED_MATURITY_LEVELS,
  SEED_COST_PARAMETERS,
  SEED_OUTCOME_TEXTS,
  SEED_PRODUCT_RECOMMENDATIONS,
  SEED_DIAGNOSTIC_QUESTIONS,
} from "../seed-data";

describe("calcGrade", () => {
  it("returns 10 for score 0 (perfect)", () => {
    expect(calcGrade(0)).toBe(10);
  });

  it("returns 0 for score 20 (worst)", () => {
    expect(calcGrade(20)).toBe(0);
  });

  it("returns 5 for score 10 (middle)", () => {
    expect(calcGrade(10)).toBe(5);
  });

  it("returns 8 for score 4", () => {
    expect(calcGrade(4)).toBe(8);
  });

  it("rounds the result", () => {
    expect(calcGrade(3)).toBe(9);
    expect(calcGrade(7)).toBe(7);
  });
});

describe("getMaturity", () => {
  it("returns Estruturado for low scores (0-3)", () => {
    const m = getMaturity(0);
    expect(m.label).toBe("Estruturado");
    expect(m.cssVar).toBe("var(--color-success)");
  });

  it("returns Em desenvolvimento for scores 4-7", () => {
    expect(getMaturity(4).label).toBe("Em desenvolvimento");
    expect(getMaturity(7).label).toBe("Em desenvolvimento");
  });

  it("returns Incipiente for scores 8-11", () => {
    expect(getMaturity(8).label).toBe("Incipiente");
    expect(getMaturity(11).label).toBe("Incipiente");
  });

  it("returns Critico for scores 12+", () => {
    expect(getMaturity(12).label).toBe("Crítico");
    expect(getMaturity(20).label).toBe("Crítico");
  });

  it("uses custom maturity levels when provided", () => {
    const m = getMaturity(5, SEED_MATURITY_LEVELS as any);
    expect(m.label).toBe("Em desenvolvimento");
    expect(m.color).toBe("#EAB308");
  });

  it("falls back to last level if score exceeds all ranges", () => {
    const m = getMaturity(99, SEED_MATURITY_LEVELS as any);
    expect(m.label).toBe("Crítico");
  });
});

describe("buildCostRows", () => {
  it("returns matching cost rows for red answers", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "red",
    };
    const rows = buildCostRows(answers, 100_000);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].label).toBe("Inadimplência sem controle");
    expect(rows[0].min).toBe(0.03 * 100_000);
    expect(rows[0].max).toBe(0.05 * 100_000);
  });

  it("returns matching cost rows for yellow answers", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "yellow",
    };
    const rows = buildCostRows(answers, 100_000);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].label).toBe("Inadimplência parcialmente controlada");
  });

  it("returns empty array for all green answers", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "green",
      "financial:q3": "green",
    };
    const rows = buildCostRows(answers, 100_000);
    expect(rows).toHaveLength(0);
  });

  it("handles qualitative rows (min/max = 0)", () => {
    const answers: Record<string, TrafficLight> = {
      "commercial:q1": "red",
    };
    const rows = buildCostRows(answers, 100_000);
    const qual = rows.find((r) => r.qualitative);
    expect(qual).toBeDefined();
    expect(qual!.min).toBe(0);
    expect(qual!.max).toBe(0);
  });

  it("uses custom cost params when provided", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "red",
    };
    const rows = buildCostRows(answers, 100_000, SEED_COST_PARAMETERS as any);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it("scales costs with monthly revenue", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "red",
    };
    const rows50k = buildCostRows(answers, 50_000);
    const rows200k = buildCostRows(answers, 200_000);
    expect(rows200k[0].min).toBe(rows50k[0].min * 4);
  });
});

describe("buildOutcomeRows", () => {
  it("includes outcomes for red and yellow answers", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "red",
      "financial:q3": "yellow",
    };
    const rows = buildOutcomeRows(answers);
    expect(rows.length).toBe(2);
  });

  it("excludes green answers", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "green",
    };
    const rows = buildOutcomeRows(answers);
    expect(rows).toHaveLength(0);
  });

  it("respects redOnly flag", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q4": "yellow",
    };
    const rows = buildOutcomeRows(answers);
    expect(rows.find((r) => r.questionId === "financial:q4")).toBeUndefined();
  });

  it("includes redOnly items when answer is red", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q4": "red",
    };
    const rows = buildOutcomeRows(answers);
    expect(rows.find((r) => r.questionId === "financial:q4")).toBeDefined();
  });

  it("uses custom outcome texts when provided", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "red",
    };
    const rows = buildOutcomeRows(answers, SEED_OUTCOME_TEXTS as any);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});

describe("buildAlerts", () => {
  it("returns alerts for red and yellow answers", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "red",
      "financial:q2": "yellow",
      "financial:q3": "green",
    };
    const alerts = buildAlerts(answers);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].level).toBe("red");
    expect(alerts[1].level).toBe("yellow");
  });

  it("returns empty for all green", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "green",
      "financial:q2": "green",
    };
    const alerts = buildAlerts(answers);
    expect(alerts).toHaveLength(0);
  });

  it("uses custom questions when provided", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "red",
    };
    const alerts = buildAlerts(answers, SEED_DIAGNOSTIC_QUESTIONS as any);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });
});

describe("getRecommendation", () => {
  it("recommends Oxy + Gênio when all answers green (healthy company)", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "green", "financial:q2": "green", "financial:q3": "green",
      "financial:q4": "green", "financial:q5": "green",
      "commercial:q1": "green", "commercial:q2": "green", "commercial:q3": "green",
      "commercial:q4": "green", "commercial:q5": "green",
    };
    const rec = getRecommendation(0, answers);
    expect(rec.service).toBe("Oxy + Gênio");
    expect(rec.calculatorPath).toBe("/calculadora/oxy");
  });

  it("recommends BPO when financial dimension has heavy pain", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "red", "financial:q2": "red", "financial:q3": "red",
      "financial:q4": "green", "financial:q5": "green",
      "commercial:q1": "green", "commercial:q2": "green", "commercial:q3": "green",
      "commercial:q4": "green", "commercial:q5": "green",
    };
    const rec = getRecommendation(6, answers);
    expect(rec.service).toBe("BPO Financeiro");
    expect(rec.calculatorPath).toBe("/calculadora/bpo");
    expect(rec.complementary).toBeUndefined();
  });

  it("recommends Assessoria when commercial dimension has heavy pain", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "green", "financial:q2": "green", "financial:q3": "green",
      "financial:q4": "green", "financial:q5": "green",
      "commercial:q1": "red", "commercial:q2": "red", "commercial:q3": "red",
      "commercial:q4": "green", "commercial:q5": "green",
    };
    const rec = getRecommendation(6, answers);
    expect(rec.service).toBe("Assessoria Estratégica");
    expect(rec.calculatorPath).toBe("/calculadora/assessoria");
  });

  it("recommends CFO when both dimensions have heavy pain", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "red", "financial:q2": "red", "financial:q3": "red",
      "financial:q4": "green", "financial:q5": "green",
      "commercial:q1": "red", "commercial:q2": "red", "commercial:q3": "red",
      "commercial:q4": "green", "commercial:q5": "green",
    };
    const rec = getRecommendation(12, answers);
    expect(rec.service).toBe("CFO as a Service");
    expect(rec.complementary?.service).toBe("Oxy + Gênio");
  });

  it("adds complementary Assessoria when financial pain + moderate commercial", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "red", "financial:q2": "red", "financial:q3": "yellow",
      "financial:q4": "green", "financial:q5": "green",
      "commercial:q1": "yellow", "commercial:q2": "yellow", "commercial:q3": "green",
      "commercial:q4": "green", "commercial:q5": "yellow",
    };
    const rec = getRecommendation(8, answers);
    expect(rec.service).toBe("BPO Financeiro");
    expect(rec.complementary?.service).toBe("Assessoria Estratégica");
  });

  it("includes reason text based on pain points", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q2": "red", "financial:q5": "yellow",
    };
    const rec = getRecommendation(3, answers);
    expect(rec.reason).toContain("cobrança sem régua");
    expect(rec.reason).toContain("conciliação bancária fraca");
  });

  it("includes gaps from alerts", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "red", "financial:q2": "yellow",
    };
    const rec = getRecommendation(3, answers);
    expect(rec.gaps.length).toBeGreaterThanOrEqual(2);
  });

  it("moderate pain in both → BPO primary when financial >= commercial", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "red", "financial:q2": "yellow",
      "financial:q3": "green", "financial:q4": "green", "financial:q5": "green",
      "commercial:q1": "yellow", "commercial:q2": "yellow",
      "commercial:q3": "green", "commercial:q4": "yellow", "commercial:q5": "green",
    };
    const rec = getRecommendation(6, answers);
    expect(rec.service).toBe("BPO Financeiro");
    expect(rec.complementary?.service).toBe("Assessoria Estratégica");
  });

  it("moderate pain in both → Assessoria primary when commercial > financial", () => {
    const answers: Record<string, TrafficLight> = {
      "financial:q1": "yellow", "financial:q2": "yellow",
      "financial:q3": "green", "financial:q4": "green", "financial:q5": "yellow",
      "commercial:q1": "red", "commercial:q2": "red",
      "commercial:q3": "green", "commercial:q4": "green", "commercial:q5": "green",
    };
    const rec = getRecommendation(7, answers);
    expect(rec.service).toBe("Assessoria Estratégica");
    expect(rec.complementary?.service).toBe("BPO Financeiro");
  });
});
