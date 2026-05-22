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
  { qid: "financial:q1", when: "red", label: "Perda por atraso em recebíveis não monitorados", min: 0.01, max: 0.02 },
  { qid: "financial:q1", when: "yellow", label: "Recebíveis parcialmente monitorados", min: 0.005, max: 0.01 },
  { qid: "financial:q2", when: "red", label: "Inadimplência sem controle", min: 0.015, max: 0.025 },
  { qid: "financial:q2", when: "yellow", label: "Inadimplência parcialmente controlada", min: 0.005, max: 0.0125 },
  { qid: "financial:q3", when: "red", label: "Compras sem processo de aprovação", min: 0.015, max: 0.023 },
  { qid: "financial:q4", when: "red", label: "Multas e juros por pagamentos em atraso", min: 0.0016, max: 0.0024 },
  { qid: "financial:q5", when: "red", label: "Erros não detectados (conciliação)", min: 0.005, max: 0.010 },
  { qid: "commercial:q1", when: "red", label: "Clientes não lucrativos sem priorização", qualitative: true },
  { qid: "commercial:q2", when: "red", label: "Margem perdida em descontos sem critério", min: 0.025, max: 0.05 },
  { qid: "commercial:q2", when: "yellow", label: "Margem cedida sem necessidade", min: 0.01, max: 0.025 },
  { qid: "commercial:q3", when: "red", label: "Capital de giro imobilizado (ciclo longo)", min: 0.04, max: 0.075 },
  { qid: "commercial:q4", when: "red", label: "Custo de antecipação recorrente (sobre 50% do faturamento)", min: 0.01, max: 0.02 },
  { qid: "commercial:q4", when: "yellow", label: "Custo de antecipação eventual (sobre 50% do faturamento)", min: 0.004, max: 0.0075 },
  { qid: "commercial:q5", when: "red", label: "Custo de crédito emergencial por descasamento de ciclo", min: 0.01, max: 0.025 },
  { qid: "commercial:q5", when: "yellow", label: "Risco de descasamento vendas x caixa", min: 0.005, max: 0.01 },
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
  { qid: "commercial:q4", current: "Antecipação de recebíveis recorrente", future: "Gestão de caixa que elimina necessidade de antecipação" },
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
  "commercial:q4": "Antecipação de recebíveis recorrente",
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
  reason: string;
  gaps: string[];
  calculatorPath: string;
  complementary?: {
    service: string;
    reason: string;
    calculatorPath: string;
  };
}

const FINANCIAL_KEYS = ["financial:q1", "financial:q2", "financial:q3", "financial:q4", "financial:q5"];
const COMMERCIAL_KEYS = ["commercial:q1", "commercial:q2", "commercial:q3", "commercial:q4", "commercial:q5"];

interface DimensionAnalysis {
  score: number;
  reds: number;
  yellows: number;
  painPoints: string[];
}

function analyzeDimension(answers: Record<string, TrafficLight>, keys: string[]): DimensionAnalysis {
  let reds = 0, yellows = 0, score = 0;
  const painPoints: string[] = [];
  for (const k of keys) {
    const a = answers[k];
    if (a === "red") { reds++; score += 2; painPoints.push(k); }
    else if (a === "yellow") { yellows++; score += 1; painPoints.push(k); }
  }
  return { score, reds, yellows, painPoints };
}

const PAIN_LABELS: Record<string, string> = {
  "financial:q1": "sem visibilidade de recebíveis",
  "financial:q2": "cobrança sem régua definida",
  "financial:q3": "compras sem processo de aprovação",
  "financial:q4": "multas e juros recorrentes",
  "financial:q5": "conciliação bancária fraca",
  "commercial:q1": "lucratividade por cliente não medida",
  "commercial:q2": "descontos concedidos sem critério",
  "commercial:q3": "condições comerciais ditadas pelo cliente",
  "commercial:q4": "antecipação de recebíveis recorrente",
  "commercial:q5": "vendas e caixa descasados",
};

type ProductKey = "bpo" | "assessoria" | "cfo" | "oxy" | "coordenador";

interface ProductInfo {
  service: string;
  path: string;
  resolves: string[];
}

const PRODUCTS: Record<ProductKey, ProductInfo> = {
  bpo: {
    service: "BPO Financeiro",
    path: "/calculadora/bpo",
    resolves: FINANCIAL_KEYS,
  },
  assessoria: {
    service: "Assessoria Estratégica",
    path: "/calculadora/assessoria",
    resolves: COMMERCIAL_KEYS,
  },
  cfo: {
    service: "CFO as a Service",
    path: "/calculadora/cfo",
    resolves: [...FINANCIAL_KEYS, ...COMMERCIAL_KEYS],
  },
  oxy: {
    service: "Oxy + Gênio",
    path: "/calculadora/oxy",
    resolves: ["financial:q1", "financial:q5", "commercial:q4"],
  },
  coordenador: {
    service: "Coordenador as a Service",
    path: "/calculadora/coordenador",
    resolves: ["financial:q3", "financial:q4", "financial:q5"],
  },
};

function buildReason(answers: Record<string, TrafficLight>, resolves: string[]): string {
  const pains = resolves
    .filter((qid) => answers[qid] === "red" || answers[qid] === "yellow")
    .map((qid) => PAIN_LABELS[qid])
    .filter(Boolean);
  if (pains.length === 0) return "Indicado para empresas que buscam evolução contínua";
  if (pains.length <= 2) return `Identificamos: ${pains.join(" e ")}`;
  return `Identificamos: ${pains.slice(0, -1).join(", ")} e ${pains[pains.length - 1]}`;
}

function pickTagline(key: ProductKey, fin: DimensionAnalysis, com: DimensionAnalysis): string {
  switch (key) {
    case "bpo":
      return fin.score >= 7
        ? "Sua operação financeira precisa de estrutura urgente"
        : "Estruture a operação financeira e elimine perdas evitáveis";
    case "assessoria":
      return com.score >= 7
        ? "Sua estratégia comercial precisa de direção imediata"
        : "Transforme a gestão comercial em vantagem competitiva";
    case "cfo":
      return "Gestão financeira executiva para transformação completa da empresa";
    case "oxy":
      return "Dados em tempo real e IA para decisões mais rápidas e precisas";
    case "coordenador":
      return "Coordenação dedicada para organizar seus processos financeiros";
  }
}

export interface ProfileContext {
  monthlyRevenue?: number;
  growth?: string;
  mainChallenges?: string[];
}

function prefersCoordenador(
  fin: DimensionAnalysis,
  answers: Record<string, TrafficLight>,
  ctx: ProfileContext,
): boolean {
  if (fin.score < 3 || fin.score > 4) return false;
  const processIssues = (answers["financial:q3"] === "red" || answers["financial:q3"] === "yellow")
    || (answers["financial:q4"] === "red" || answers["financial:q4"] === "yellow");
  if (!processIssues) return false;
  const hasTeamChallenge = ctx.mainChallenges?.includes("Equipe júnior / falta braço") ?? false;
  const isGrowing = ctx.growth === "strong" || ctx.growth === "moderate";
  return hasTeamChallenge || isGrowing;
}

export function getRecommendation(
  overallScore: number,
  answers: Record<string, TrafficLight>,
  _recommendations?: ProductRecommendation[],
  questions?: DiagnosticQuestion[],
  profile?: ProfileContext,
): Recommendation {
  const gaps = buildAlerts(answers, questions).map((a) => a.text);
  const fin = analyzeDimension(answers, FINANCIAL_KEYS);
  const com = analyzeDimension(answers, COMMERCIAL_KEYS);

  const ctx = profile ?? {};
  const cfoAllowed = !ctx.monthlyRevenue || ctx.monthlyRevenue >= 700_000;

  let primary: ProductKey;
  let secondary: ProductKey | null = null;

  if (fin.score >= 5 && com.score >= 5) {
    if (cfoAllowed) {
      primary = "cfo";
      secondary = "coordenador";
    } else {
      primary = "bpo";
      secondary = "assessoria";
    }
  } else if (fin.score >= 5) {
    primary = "bpo";
    secondary = com.score >= 3 ? "assessoria" : null;
  } else if (com.score >= 5) {
    primary = "assessoria";
    secondary = fin.score >= 3 ? "bpo" : null;
  } else if (fin.score >= 3 && com.score >= 3) {
    if (prefersCoordenador(fin, answers, ctx)) {
      primary = "coordenador";
      secondary = "assessoria";
    } else if (fin.score >= com.score) {
      primary = "bpo";
      secondary = "assessoria";
    } else {
      primary = "assessoria";
      secondary = "bpo";
    }
  } else if (fin.score >= 3) {
    primary = prefersCoordenador(fin, answers, ctx) ? "coordenador" : "bpo";
  } else if (com.score >= 3) {
    primary = "assessoria";
  } else {
    primary = "oxy";
  }

  const p = PRODUCTS[primary];
  const result: Recommendation = {
    service: p.service,
    tagline: pickTagline(primary, fin, com),
    reason: buildReason(answers, p.resolves),
    gaps,
    calculatorPath: p.path,
  };

  if (secondary) {
    const s = PRODUCTS[secondary];
    result.complementary = {
      service: s.service,
      reason: buildReason(answers, s.resolves),
      calculatorPath: s.path,
    };
  }

  return result;
}

export { formatBRL } from "./format";
