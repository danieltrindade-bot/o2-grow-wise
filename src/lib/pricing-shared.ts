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

// ── Coordenador Financeiro ──
// Matriz fixa do Playbook/Escopo (valores são a fonte da verdade; os rótulos
// "+20%/+40%" do material não batem com os números, então não calculamos %).
export type CoordPerfil = "essencial" | "estruturado" | "integrado";
export type CoordNivel = "baixa" | "media" | "alta";

const COORD_SETUP: Record<CoordPerfil, Record<CoordNivel, number>> = {
  essencial: { baixa: 3727, media: 3926, alta: 4125 },
  estruturado: { baixa: 5218, media: 5417, alta: 5616 },
  integrado: { baixa: 6709, media: 6908, alta: 7107 },
};

const COORD_MENSAL: Record<CoordPerfil, Record<CoordNivel, number>> = {
  essencial: { baixa: 1739.5, media: 2087.4, alta: 2435.3 },
  estruturado: { baixa: 2485, media: 2982, alta: 3479 },
  integrado: { baixa: 3727, media: 4174, alta: 5119 },
};

// Mais CNPJs → maior complexidade (multi-CNPJ é o 1º ajuste citado no material).
export function cnpjToNivel(cnpjCount: number): CoordNivel {
  if (cnpjCount <= 1) return "baixa";
  if (cnpjCount === 2) return "media";
  return "alta";
}

export interface CoordResult {
  perfil: CoordPerfil;
  nivel: CoordNivel;
  setup: number;
  mensal: number;
}

export function calcCoordenadorPrice(perfil: CoordPerfil, cnpjCount: number): CoordResult {
  const nivel = cnpjToNivel(cnpjCount);
  return { perfil, nivel, setup: COORD_SETUP[perfil][nivel], mensal: COORD_MENSAL[perfil][nivel] };
}

export { formatBRL } from "./format";
