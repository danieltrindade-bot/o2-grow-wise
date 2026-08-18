// Modelo de dados único das propostas em HTML.
//
// Toda calculadora monta um ProposalModel com números crus. A partir dele,
// dois renderizadores independentes produzem saída: o PDF (jsPDF, via
// toCalcPDFInput) e a proposta em HTML (renderProposalHTML). Nenhum dos dois
// depende do outro — e nenhum recebe string já formatada, senão perderia a
// capacidade de recalcular comparativos.

/**
 * Item de escopo. String simples vira um bullet corrido; a forma agrupada
 * renderiza "Rótulo: itens", com o rótulo em destaque — mais legível quando o
 * escopo é longo, porque o cliente varre os rótulos antes de ler o detalhe.
 */
export type ScopeItem = string | { label: string; text: string };

/** Texto plano do item, para o PDF e outros destinos sem formatação. */
export function scopeText(item: ScopeItem): string {
  return typeof item === "string" ? item : `${item.label}: ${item.text}`;
}

export interface ProposalService {
  /** Chave em SERVICE_DETAILS, quando existir (cfo, coordenador, bpo…). */
  key: string;
  name: string;
  /** Uma frase sobre o papel do serviço, exibida sob o nome. */
  role: string;
  /** Mensalidade de tabela, sem desconto de fechamento. */
  monthly: number;
  scope: ScopeItem[];
  notIncluded?: string[];
}

export interface ProposalSetup {
  label: string;
  total: number;
  installments: number;
}

/** Condição especial de fechamento. Ausente quando não há negociação. */
export interface ClosingOffer {
  /** Mensalidade fechada, cobrindo todos os serviços da proposta. */
  monthly: number;
  setupTotal: number;
  installments: number;
  note?: string;
}

export interface CltRole {
  role: string;
  detail?: string;
  salary: number;
}

export interface ProposalPain {
  title: string;
  description: string;
  quote?: string;
}

export interface ProposalModel {
  client: {
    name: string;
    logoDataUrl?: string;
    monthlyRevenue?: number;
    cnpjCount?: number;
    profile?: string;
  };
  /** ISO date (yyyy-mm-dd). Default: hoje. */
  date?: string;
  headline?: string;
  subheadline?: string;
  services: ProposalService[];
  setup?: ProposalSetup;
  closing?: ClosingOffer;
  /** Cargos CLT equivalentes. Default: derivado das chaves dos serviços. */
  cltRoles?: CltRole[];
  /** Multiplicador de encargos sobre o salário bruto. */
  cltFactor?: number;
  pains?: ProposalPain[];
  validityDays?: number;
  noticeDays?: number;
  /** Texto da recomendação final. Default: gerado. */
  recommendation?: string;
}

export const DEFAULT_CLT_FACTOR = 1.68;
export const DEFAULT_VALIDITY_DAYS = 15;
export const DEFAULT_NOTICE_DAYS = 60;

export interface MoneyBlock {
  monthly: number;
  setupTotal: number;
  setupInstallment: number;
  installments: number;
  /** Desembolso mensal durante o parcelamento do setup. */
  firstYearMonthly: number;
  /** Total desembolsado no período do parcelamento. */
  firstYearTotal: number;
  /** Recorrência após o setup quitado. */
  recurringAfter: number;
}

export interface ClosingComputed extends MoneyBlock {
  monthlyDiscount: number;
  monthlyDiscountPct: number;
  setupDiscount: number;
  setupDiscountPct: number;
  firstYearSaving: number;
  firstYearSavingPct: number;
}

export interface CltComputed {
  rows: Array<CltRole & { cost: number }>;
  monthly: number;
  yearly: number;
  factor: number;
}

export interface ProposalComputed {
  isBundle: boolean;
  hasClosing: boolean;
  /** Bloco de valores de tabela (sem condição especial). */
  table: MoneyBlock;
  closing?: ClosingComputed;
  clt?: CltComputed;
  /** Comparação do cenário vigente (fechamento se houver, senão tabela) com a folha CLT. */
  vsClt?: {
    pctBelowFirstYear: number;
    pctBelowRecurring: number;
    yearlySaving: number;
  };
  /** Percentual da receita mensal do cliente que o investimento representa. */
  revenueShare?: { firstYear: number; recurring: number; clt?: number };
  headline: string;
  date: string;
  validityDays: number;
  noticeDays: number;
}

/** Salário de referência por serviço, para a âncora CLT. */
export const CLT_REFERENCE: Record<string, CltRole> = {
  cfo: {
    role: "CFO / Diretor Financeiro sênior",
    detail: "Perfil com experiência em grupo multi-CNPJ e captação",
    salary: 35000,
  },
  coordenador: {
    role: "Coordenador Financeiro",
    detail: "Padronização de rotina, conferência e cadência da equipe",
    salary: 9000,
  },
  bpo: {
    role: "Analista Financeiro (2 profissionais)",
    detail: "Contas a pagar, contas a receber e conciliação bancária",
    salary: 8400,
  },
  oxy: {
    role: "Analista de BI / Dados",
    detail: "Construção e manutenção de painéis gerenciais",
    salary: 9500,
  },
  assessoria: {
    role: "Gerente de Planejamento Financeiro",
    detail: "Orçamento, forecast e acompanhamento de indicadores",
    salary: 16000,
  },
  estrategico: {
    role: "Diretor de Planejamento Estratégico",
    detail: "Condução do planejamento e dos comitês de gestão",
    salary: 28000,
  },
  turnaround: {
    role: "Diretor de Reestruturação",
    detail: "Renegociação de passivos e recuperação de resultado",
    salary: 38000,
  },
  tributario: {
    role: "Especialista Tributário sênior",
    detail: "Planejamento fiscal e revisão de enquadramento",
    salary: 18000,
  },
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

function moneyBlock(
  monthly: number,
  setup?: ProposalSetup | { total: number; installments: number },
): MoneyBlock {
  const setupTotal = setup?.total ?? 0;
  const installments = setup?.installments ?? 0;
  const setupInstallment = installments > 0 ? setupTotal / installments : 0;
  const firstYearMonthly = monthly + setupInstallment;
  return {
    monthly,
    setupTotal,
    setupInstallment,
    installments,
    firstYearMonthly,
    firstYearTotal: firstYearMonthly * (installments || 12),
    recurringAfter: monthly,
  };
}

/** Monta o headline padrão: "CFO + Coordenador = a combinação certa para a Bethel". */
export function defaultHeadline(model: ProposalModel): string {
  const client = model.client.name?.trim() || "sua empresa";
  const shortNames = model.services.map((s) => shortServiceName(s.name));
  if (shortNames.length === 0) return `Proposta para a ${client}`;
  if (shortNames.length === 1) return `${shortNames[0]} para a ${client}`;
  return `${shortNames.join(" + ")} = a combinação certa para a ${client}`;
}

/** "CFO as a Service" -> "CFO"; "Coordenador as a Service" -> "Coordenador". */
export function shortServiceName(name: string): string {
  return name.replace(/\s+as a Service\s*$/i, "").trim();
}

export function deriveProposal(model: ProposalModel): ProposalComputed {
  const factor = model.cltFactor ?? DEFAULT_CLT_FACTOR;
  const tableMonthly = model.services.reduce((sum, s) => sum + s.monthly, 0);
  const table = moneyBlock(tableMonthly, model.setup);

  let closing: ClosingComputed | undefined;
  if (model.closing) {
    const c = model.closing;
    const block = moneyBlock(c.monthly, { total: c.setupTotal, installments: c.installments });
    closing = {
      ...block,
      monthlyDiscount: tableMonthly - c.monthly,
      monthlyDiscountPct: pct(tableMonthly - c.monthly, tableMonthly),
      setupDiscount: table.setupTotal - c.setupTotal,
      setupDiscountPct: pct(table.setupTotal - c.setupTotal, table.setupTotal),
      firstYearSaving: table.firstYearTotal - block.firstYearTotal,
      firstYearSavingPct: pct(table.firstYearTotal - block.firstYearTotal, table.firstYearTotal),
    };
  }

  const roles =
    model.cltRoles ??
    model.services.map((s) => CLT_REFERENCE[s.key]).filter((r): r is CltRole => Boolean(r));

  let clt: CltComputed | undefined;
  if (roles.length > 0) {
    const rows = roles.map((r) => ({ ...r, cost: r.salary * factor }));
    const monthly = rows.reduce((sum, r) => sum + r.cost, 0);
    clt = { rows, monthly, yearly: monthly * 12, factor };
  }

  const current = closing ?? table;
  const vsClt = clt
    ? {
        pctBelowFirstYear: pct(clt.monthly - current.firstYearMonthly, clt.monthly),
        pctBelowRecurring: pct(clt.monthly - current.recurringAfter, clt.monthly),
        yearlySaving: clt.yearly - current.firstYearTotal,
      }
    : undefined;

  const revenue = model.client.monthlyRevenue;
  const revenueShare =
    revenue && revenue > 0
      ? {
          firstYear: pct(current.firstYearMonthly, revenue),
          recurring: pct(current.recurringAfter, revenue),
          clt: clt ? pct(clt.monthly, revenue) : undefined,
        }
      : undefined;

  return {
    isBundle: model.services.length > 1,
    hasClosing: Boolean(closing),
    table,
    closing,
    clt,
    vsClt,
    revenueShare,
    headline: model.headline?.trim() || defaultHeadline(model),
    date: model.date || todayISO(),
    validityDays: model.validityDays ?? DEFAULT_VALIDITY_DAYS,
    noticeDays: model.noticeDays ?? DEFAULT_NOTICE_DAYS,
  };
}
