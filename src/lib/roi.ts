import { useMemo } from "react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { useDiagnosticConfig } from "@/hooks/use-pricing";
import { buildCostRows } from "@/lib/results-logic";

/**
 * Fração da perda MÍNIMA estimada usada no racional de ROI.
 * Capturamos só 50% para projetar um retorno deliberadamente conservador —
 * mesmo recuperando metade da perda mínima, a solução ainda paga o investimento.
 */
export const ROI_CONSERVATIVE_FACTOR = 0.5;

export interface RoiResult {
  recoverableMonthly: number;
  recoverableAnnual: number;
  investmentMonthly: number;
  investmentAnnual: number;
  netAnnual: number;
  paybackMonths: number;
  multiple: number;
  positive: boolean;
}

export function computeRoi(lossMinMonthly: number, investmentMonthly: number): RoiResult | null {
  const recoverableMonthly = lossMinMonthly * ROI_CONSERVATIVE_FACTOR;
  if (recoverableMonthly <= 0 || investmentMonthly <= 0) return null;

  const recoverableAnnual = recoverableMonthly * 12;
  const investmentAnnual = investmentMonthly * 12;
  return {
    recoverableMonthly,
    recoverableAnnual,
    investmentMonthly,
    investmentAnnual,
    netAnnual: recoverableAnnual - investmentAnnual,
    // Meses de economia recuperada necessários para cobrir o investimento de 1 ano.
    paybackMonths: investmentAnnual / recoverableMonthly,
    multiple: recoverableAnnual / investmentAnnual,
    positive: recoverableAnnual > investmentAnnual,
  };
}

/** Lê o diagnóstico do contexto e devolve a perda mensal estimada (min/max). */
export function useDiagnosticLoss() {
  const { state } = useDiagnostic();
  const { data: config } = useDiagnosticConfig();

  const rows = useMemo(
    () => buildCostRows(state.answers, state.monthlyRevenue, config?.costs, state.sector),
    [state.answers, state.monthlyRevenue, config, state.sector],
  );

  const hasData =
    state.companyName.trim().length > 0 && Object.keys(state.answers).length > 0;

  return {
    hasData,
    lossMinMonthly: rows.reduce((s, r) => s + r.min, 0),
    lossMaxMonthly: rows.reduce((s, r) => s + r.max, 0),
  };
}
