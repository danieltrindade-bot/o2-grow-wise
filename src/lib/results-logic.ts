import { QUESTIONS, type OptionKey } from "./diagnostic-questions";
import type { TrafficLight } from "@/context/DiagnosticContext";
import type {
  CostParameter,
  MaturityLevel,
  OutcomeText,
  ProductRecommendation,
  DiagnosticQuestion,
} from "@/hooks/use-pricing";

export function calcGrade(overallScore: number): number {
  return Math.round(((20 - overallScore) / 20) * 10);
}

export interface Maturity {
  label: string;
  description: string;
  color: string;
  cssVar: string;
}

const MATURITY_CSS: Record<string, string> = {
  structured: "var(--color-success)",
  developing: "var(--color-warning)",
  incipient: "var(--color-alert)",
  critical: "var(--color-critical)",
};

function maturityCssFromColor(color: string): string {
  const c = color.toUpperCase();
  if (c === "#22C55E") return "var(--color-success)";
  if (c === "#EAB308") return "var(--color-warning)";
  if (c === "#F97316") return "var(--color-alert)";
  if (c === "#EF4444") return "var(--color-critical)";
  return color;
}

export function getMaturity(score: number, levels?: MaturityLevel[]): Maturity {
  if (levels && levels.length) {
    const m = levels.find((l) => score >= l.score_min && score <= l.score_max) ?? levels[levels.length - 1];
    return {
      label: m.label,
      description: m.description,
      color: m.color,
      cssVar: MATURITY_CSS[m.level_key] ?? maturityCssFromColor(m.color),
    };
  }
  if (score <= 3)
    return { label: "Estruturado", description: "A empresa possui processos financeiros bem definidos", color: "#22C55E", cssVar: "var(--color-success)" };
  if (score <= 7)
    return { label: "Em desenvolvimento", description: "Existem processos, mas precisam de consolidação", color: "#EAB308", cssVar: "var(--color-warning)" };
  if (score <= 11)
    return { label: "Incipiente", description: "Processos financeiros ainda informais e frágeis", color: "#F97316", cssVar: "var(--color-alert)" };
  return { label: "Crítico", description: "Ausência de controles financeiros básicos", color: "#EF4444", cssVar: "var(--color-critical)" };
}

export interface CostRow {
  questionId: string;
  label: string;
  min: number;
  max: number;
  qualitative?: boolean;
}

interface CostRule {
  qid: string;
  when: OptionKey;
  label: string;
  min?: number;
  max?: number;
  qualitative?: boolean;
}

const COST_RULES: CostRule[] = [
  { qid: "financial:q2", when: "red", label: "Inadimplência sem controle", min: 0.03, max: 0.05 },
  { qid: "financial:q2", when: "yellow", label: "Inadimplência parcialmente controlada", min: 0.01, max: 0.025 },
  { qid: "financial:q3", when: "red", label: "Compras sem processo de aprovação", min: 0.015, max: 0.023 },
  { qid: "financial:q4", when: "red", label: "Multas e juros por pagamentos em atraso", min: 0.0016, max: 0.0024 },
  { qid: "financial:q5", when: "red", label: "Erros não detectados (conciliação)", min: 0.005, max: 0.010 },
  { qid: "commercial:q2", when: "red", label: "Margem perdida em descontos sem critério", min: 0.05, max: 0.10 },
  { qid: "commercial:q2", when: "yellow", label: "Margem cedida sem necessidade", min: 0.02, max: 0.05 },
  { qid: "commercial:q3", when: "red", label: "Capital de giro imobilizado (ciclo longo)", min: 0.08, max: 0.15 },
  { qid: "commercial:q1", when: "red", label: "Clientes não lucrativos sem priorização", qualitative: true },
];

export function buildCostRows(
  answers: Record<string, TrafficLight>,
  monthlyRevenue: number,
  costParams?: CostParameter[],
): CostRow[] {
  const rules: CostRule[] = costParams
    ? costParams.map((c) => ({
        qid: `${c.dimension}:${c.question_key}`,
        when: c.trigger_color,
        label: c.label,
        min: c.pct_min ?? undefined,
        max: c.pct_max ?? undefined,
        qualitative: c.qualitative,
      }))
    : COST_RULES;
  return rules
    .filter((r) => answers[r.qid] === r.when)
    .map((r) => ({
      questionId: r.qid,
      label: r.label,
      min: r.qualitative ? 0 : (r.min ?? 0) * monthlyRevenue,
      max: r.qualitative ? 0 : (r.max ?? 0) * monthlyRevenue,
      qualitative: r.qualitative,
    }));
}

export interface OutcomeRow {
  questionId: string;
  current: string;
  future: string;
}

interface OutcomeRule {
  qid: string;
  current: string;
  future: string;
  redOnly?: boolean;
}

const OUTCOME_RULES: OutcomeRule[] = [
  { qid: "financial:q2", current: "Sem régua de cobrança ativa", future: "Régua de cobrança reduz inadimplência em 40–60%" },
  { qid: "financial:q3", current: "Compras aprovadas informalmente", future: "Fluxo com alçadas — zero pagamentos sem aprovação" },
  { qid: "financial:q4", current: "Multas e juros recorrentes", future: "Calendário de pagamentos — multas eliminadas", redOnly: true },
  { qid: "financial:q5", current: "Conciliação mensal ou inexistente", future: "Conciliação semanal — erros detectados em 48h" },
  { qid: "commercial:q2", current: "Desconto decidido na hora", future: "Piso de margem definido — desconto só dentro do aprovado" },
  { qid: "commercial:q3", current: "Cliente define as condições", future: "Tabela padrão — empresa retoma o controle" },
  { qid: "commercial:q4", current: "Caixa imprevisível", future: "Forecast confiável de 30/60/90 dias" },
  { qid: "commercial:q5", current: "Vende muito, caixa aperta", future: "Ciclo financeiro de vendas mapeado e gerenciado" },
];

export function buildOutcomeRows(
  answers: Record<string, TrafficLight>,
  outcomes?: OutcomeText[],
): OutcomeRow[] {
  const rules: OutcomeRule[] = outcomes
    ? outcomes.map((o) => ({
        qid: `${o.dimension}:${o.question_key}`,
        current: o.current_text,
        future: o.future_text,
        redOnly: o.check_red,
      }))
    : OUTCOME_RULES;
  return rules
    .filter((r) => {
      const a = answers[r.qid];
      if (r.redOnly) return a === "red";
      return a === "red" || a === "yellow";
    })
    .map((r) => ({ questionId: r.qid, current: r.current, future: r.future }));
}

const SHORT_LABELS: Record<string, string> = {
  "financial:q1": "Sem visibilidade de recebíveis",
  "financial:q2": "Cobrança sem régua",
  "financial:q3": "Compras sem aprovação",
  "financial:q4": "Multas e juros frequentes",
  "financial:q5": "Conciliação fraca",
  "commercial:q1": "Lucratividade não medida",
  "commercial:q2": "Desconto sem critério",
  "commercial:q3": "Cliente define condições",
  "commercial:q4": "Sem forecast de caixa",
  "commercial:q5": "Vendas x caixa descasados",
};

export interface AlertItem {
  questionId: string;
  level: "red" | "yellow";
  text: string;
}

function shortify(text: string): string {
  const words = text.split(/\s+/).slice(0, 6).join(" ");
  return words.length < text.length ? `${words}…` : words;
}

export function buildAlerts(
  answers: Record<string, TrafficLight>,
  questions?: DiagnosticQuestion[],
): AlertItem[] {
  if (questions && questions.length) {
    return questions.flatMap((q) => {
      const qid = `${q.dimension}:${q.question_key}`;
      const a = answers[qid];
      if (a === "red" || a === "yellow") {
        return [{ questionId: qid, level: a, text: SHORT_LABELS[qid] ?? shortify(q.question_text) }];
      }
      return [];
    });
  }
  return QUESTIONS.flatMap((q) => {
    const a = answers[q.id];
    if (a === "red" || a === "yellow") {
      return [{ questionId: q.id, level: a, text: SHORT_LABELS[q.id] ?? shortify(q.text) }];
    }
    return [];
  });
}

export interface Recommendation {
  service: string;
  tagline: string;
  gaps: string[];
}

export function getRecommendation(
  overallScore: number,
  answers: Record<string, TrafficLight>,
  recommendations?: ProductRecommendation[],
  questions?: DiagnosticQuestion[],
): Recommendation {
  const gaps = buildAlerts(answers, questions).map((a) => a.text);
  if (recommendations && recommendations.length) {
    const r =
      recommendations.find((x) => overallScore >= x.score_min && overallScore <= x.score_max) ??
      recommendations[recommendations.length - 1];
    return { service: r.name, tagline: r.tagline, gaps };
  }
  if (overallScore <= 4) return { service: "O2 Processos", tagline: "Estruture os processos financeiros que sustentam o crescimento", gaps };
  if (overallScore <= 9) return { service: "O2 Processos + O2 Receita", tagline: "Transformação financeira e comercial completa", gaps };
  return { service: "CFO as a Service", tagline: "Inteligência financeira executiva sob demanda", gaps };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
