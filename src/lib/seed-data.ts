import type {
  DiagnosticQuestion,
  CostParameter,
  MaturityLevel,
  OutcomeText,
  ProductRecommendation,
  BPOPackage,
  BPOSetupModule,
  CFOBaseRule,
  CFOCnpjRule,
  CFOComplexityRule,
  CFOSegmentRule,
  CFOGovernanceRule,
  SetupPricingRule,
  AssessoriaRule,
  AssessoriaSettings,
} from "@/hooks/use-pricing";

type WithId<T> = T & { id: string };

// ---------------------------------------------------------------------------
// Diagnostic Questions (10 questions)
// ---------------------------------------------------------------------------
export const SEED_DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  { id: "dq-1", dimension: "financial", question_key: "q1", global_order: 1, question_text: "Se perguntarmos agora quanto a empresa tem a receber nos próximos 30 dias — conseguem responder com precisão em menos de 5 minutos?", option_green: "Sim, temos controle preciso", option_yellow: "Temos uma ideia geral, mas não consolidado", option_red: "Não conseguiríamos responder" },
  { id: "dq-2", dimension: "financial", question_key: "q2", global_order: 2, question_text: "Quando um cliente não paga no vencimento, existe uma régua de cobrança definida com responsável e canal?", option_green: "Sim, temos isso estruturado", option_yellow: "Fazemos algo, mas é informal", option_red: "Não temos / Não sei" },
  { id: "dq-3", dimension: "financial", question_key: "q3", global_order: 3, question_text: "Existe um processo formal de aprovação para compras, com alçadas e registro — com prazo, antes do pagamento?", option_green: "Sim, temos fluxo de aprovação", option_yellow: "Aprovação informal ou parcial", option_red: "Não temos processo definido" },
  { id: "dq-4", dimension: "financial", question_key: "q4", global_order: 4, question_text: "Pagamentos em atraso, multas ou juros com fornecedores acontecem com frequência?", option_green: "Raramente ou nunca acontece", option_yellow: "Acontece às vezes", option_red: "Sim, é comum" },
  { id: "dq-5", dimension: "financial", question_key: "q5", global_order: 5, question_text: "A empresa faz conciliação bancária com frequência — semanal ou mais?", option_green: "Sim, semanalmente ou mais", option_yellow: "Mensalmente", option_red: "Pelo contador ou não fazemos" },
  { id: "dq-6", dimension: "commercial", question_key: "q1", global_order: 6, question_text: "A empresa sabe quais clientes ou produtos são mais lucrativos — não só os que mais faturam, mas os que mais geram margem?", option_green: "Sim, temos essa visibilidade", option_yellow: "Sabemos parcialmente", option_red: "Não medimos / não sabemos" },
  { id: "dq-7", dimension: "commercial", question_key: "q2", global_order: 7, question_text: "Quando o time de vendas dá desconto, existe um limite definido com critério claro de aprovação?", option_green: "Sim, temos política de desconto", option_yellow: "Existe algo informal", option_red: "Desconto é decidido na hora" },
  { id: "dq-8", dimension: "commercial", question_key: "q3", global_order: 8, question_text: "As condições de pagamento são definidas pela empresa ou pelo cliente na hora de fechar o negócio?", option_green: "A empresa define as condições", option_yellow: "Negociamos caso a caso", option_red: "O cliente acaba definindo" },
  { id: "dq-9", dimension: "commercial", question_key: "q4", global_order: 9, question_text: "Conseguem projetar quanto vai entrar no caixa nos próximos 60 dias com base no pipeline de vendas?", option_green: "Sim, temos forecast integrado", option_yellow: "Estimamos de forma aproximada", option_red: "Não conseguimos projetar" },
  { id: "dq-10", dimension: "commercial", question_key: "q5", global_order: 10, question_text: "Já aconteceu de vender muito em um mês e não ter caixa suficiente no mês seguinte?", option_green: "Nunca aconteceu", option_yellow: "Aconteceu raramente", option_red: "Sim, é recorrente" },
];

// ---------------------------------------------------------------------------
// Cost Parameters (9 rules)
// ---------------------------------------------------------------------------
export const SEED_COST_PARAMETERS: CostParameter[] = [
  { id: "cp-1", dimension: "financial", question_key: "q2", trigger_color: "red", label: "Inadimplência sem controle", pct_min: 0.03, pct_max: 0.05, qualitative: false },
  { id: "cp-2", dimension: "financial", question_key: "q2", trigger_color: "yellow", label: "Inadimplência parcialmente controlada", pct_min: 0.01, pct_max: 0.025, qualitative: false },
  { id: "cp-3", dimension: "financial", question_key: "q3", trigger_color: "red", label: "Compras sem processo de aprovação", pct_min: 0.015, pct_max: 0.023, qualitative: false },
  { id: "cp-4", dimension: "financial", question_key: "q4", trigger_color: "red", label: "Multas e juros por pagamentos em atraso", pct_min: 0.0016, pct_max: 0.0024, qualitative: false },
  { id: "cp-5", dimension: "financial", question_key: "q5", trigger_color: "red", label: "Erros não detectados (conciliação)", pct_min: 0.005, pct_max: 0.01, qualitative: false },
  { id: "cp-6", dimension: "commercial", question_key: "q2", trigger_color: "red", label: "Margem perdida em descontos sem critério", pct_min: 0.05, pct_max: 0.1, qualitative: false },
  { id: "cp-7", dimension: "commercial", question_key: "q2", trigger_color: "yellow", label: "Margem cedida sem necessidade", pct_min: 0.02, pct_max: 0.05, qualitative: false },
  { id: "cp-8", dimension: "commercial", question_key: "q3", trigger_color: "red", label: "Capital de giro imobilizado (ciclo longo)", pct_min: 0.08, pct_max: 0.15, qualitative: false },
  { id: "cp-9", dimension: "commercial", question_key: "q1", trigger_color: "red", label: "Clientes não lucrativos sem priorização", pct_min: 0, pct_max: 0, qualitative: true },
];

// ---------------------------------------------------------------------------
// Maturity Levels
// ---------------------------------------------------------------------------
export const SEED_MATURITY_LEVELS: MaturityLevel[] = [
  { id: "ml-1", level_key: "structured", label: "Estruturado", description: "A empresa possui processos financeiros bem definidos", color: "#22C55E", score_min: 0, score_max: 3, sort_order: 1 },
  { id: "ml-2", level_key: "developing", label: "Em desenvolvimento", description: "Existem processos, mas precisam de consolidação", color: "#EAB308", score_min: 4, score_max: 7, sort_order: 2 },
  { id: "ml-3", level_key: "incipient", label: "Incipiente", description: "Processos financeiros ainda informais e frágeis", color: "#F97316", score_min: 8, score_max: 11, sort_order: 3 },
  { id: "ml-4", level_key: "critical", label: "Crítico", description: "Ausência de controles financeiros básicos", color: "#EF4444", score_min: 12, score_max: 20, sort_order: 4 },
];

// ---------------------------------------------------------------------------
// Outcome Texts
// ---------------------------------------------------------------------------
export const SEED_OUTCOME_TEXTS: OutcomeText[] = [
  { id: "ot-1", dimension: "financial", question_key: "q2", current_text: "Sem régua de cobrança ativa", future_text: "Régua de cobrança reduz inadimplência em 40–60%", check_red: false },
  { id: "ot-2", dimension: "financial", question_key: "q3", current_text: "Compras aprovadas informalmente", future_text: "Fluxo com alçadas — zero pagamentos sem aprovação", check_red: false },
  { id: "ot-3", dimension: "financial", question_key: "q4", current_text: "Multas e juros recorrentes", future_text: "Calendário de pagamentos — multas eliminadas", check_red: true },
  { id: "ot-4", dimension: "financial", question_key: "q5", current_text: "Conciliação mensal ou inexistente", future_text: "Conciliação semanal — erros detectados em 48h", check_red: false },
  { id: "ot-5", dimension: "commercial", question_key: "q2", current_text: "Desconto decidido na hora", future_text: "Piso de margem definido — desconto só dentro do aprovado", check_red: false },
  { id: "ot-6", dimension: "commercial", question_key: "q3", current_text: "Cliente define as condições", future_text: "Tabela padrão — empresa retoma o controle", check_red: false },
  { id: "ot-7", dimension: "commercial", question_key: "q4", current_text: "Caixa imprevisível", future_text: "Forecast confiável de 30/60/90 dias", check_red: false },
  { id: "ot-8", dimension: "commercial", question_key: "q5", current_text: "Vende muito, caixa aperta", future_text: "Ciclo financeiro de vendas mapeado e gerenciado", check_red: false },
];

// ---------------------------------------------------------------------------
// Product Recommendations
// ---------------------------------------------------------------------------
export const SEED_PRODUCT_RECOMMENDATIONS: ProductRecommendation[] = [
  { id: "pr-1", rule_key: "high", name: "O2 Processos", tagline: "Estruture os processos financeiros que sustentam o crescimento", price: 3500, score_min: 0, score_max: 4 },
  { id: "pr-2", rule_key: "mid", name: "O2 Processos + O2 Receita", tagline: "Transformação financeira e comercial completa", price: 6670, score_min: 5, score_max: 9 },
  { id: "pr-3", rule_key: "low", name: "CFO as a Service", tagline: "Inteligência financeira executiva sob demanda", price: 7500, score_min: 10, score_max: 20 },
];

// ---------------------------------------------------------------------------
// BPO Packages
// ---------------------------------------------------------------------------
export const SEED_BPO_PACKAGES: BPOPackage[] = [
  { id: "bp-1", name: "Essencial", description: "Operação financeira básica", price_tier_1: 1500, price_tier_2: 2500, price_tier_3: 4000, display_order: 1 },
  { id: "bp-2", name: "Controle", description: "Gestão financeira completa", price_tier_1: 2500, price_tier_2: 4000, price_tier_3: 6000, display_order: 2 },
  { id: "bp-3", name: "Gestão Estratégica", description: "Gestão financeira estratégica", price_tier_1: 4000, price_tier_2: 6500, price_tier_3: 10000, display_order: 3 },
];

// ---------------------------------------------------------------------------
// BPO Settings
// ---------------------------------------------------------------------------
export const SEED_BPO_SETTINGS: { id: string; key: string; value: string }[] = [
  { id: "bs-1", key: "dias_uteis", value: "22" },
  { id: "bs-2", key: "tier_1_limit", value: "200" },
  { id: "bs-3", key: "tier_2_limit", value: "500" },
];

// ---------------------------------------------------------------------------
// BPO Setup Module
// ---------------------------------------------------------------------------
export const SEED_BPO_SETUP_MODULE: BPOSetupModule[] = [
  { id: "bsm-1", name: "SETUP+OXY+GÊNIO", is_active: true, is_mandatory: true, installments: 12, installment_value: 887, add_to_monthly: true },
];

// ---------------------------------------------------------------------------
// CFO Base Rules (faturamento ANUAL)
// ---------------------------------------------------------------------------
export const SEED_CFO_BASE_RULES: CFOBaseRule[] = [
  { id: "cbr-1", label: "até 500k", min_revenue: 0, max_revenue: 6000000, base_price: 6570, sort_order: 1 },
  { id: "cbr-2", label: "500k - 700k", min_revenue: 6000000, max_revenue: 8400000, base_price: 6970, sort_order: 2 },
  { id: "cbr-3", label: "700k - 1M", min_revenue: 8400000, max_revenue: 12000000, base_price: 7570, sort_order: 3 },
  { id: "cbr-4", label: "1M - 2.5M", min_revenue: 12000000, max_revenue: 30000000, base_price: 8570, sort_order: 4 },
  { id: "cbr-5", label: "2.5M - 5M", min_revenue: 30000000, max_revenue: 60000000, base_price: 10570, sort_order: 5 },
  { id: "cbr-6", label: "≥ 5M", min_revenue: 60000000, max_revenue: 999999999999, base_price: 12570, sort_order: 6 },
];

// ---------------------------------------------------------------------------
// CFO CNPJ Rules
// ---------------------------------------------------------------------------
export const SEED_CFO_CNPJ_RULES: WithId<CFOCnpjRule>[] = [
  { id: "ccr-1", cnpj_count: 1, multiplier: 1.0 },
  { id: "ccr-2", cnpj_count: 2, multiplier: 1.3 },
  { id: "ccr-3", cnpj_count: 3, multiplier: 1.5 },
  { id: "ccr-4", cnpj_count: 4, multiplier: 1.7 },
  { id: "ccr-5", cnpj_count: 5, multiplier: 1.9 },
  { id: "ccr-6", cnpj_count: 6, multiplier: 2.1 },
  { id: "ccr-7", cnpj_count: 7, multiplier: 2.3 },
  { id: "ccr-8", cnpj_count: 8, multiplier: 2.5 },
  { id: "ccr-9", cnpj_count: 9, multiplier: 2.7 },
  { id: "ccr-10", cnpj_count: 10, multiplier: 2.9 },
];

// ---------------------------------------------------------------------------
// CFO Complexity Rules
// ---------------------------------------------------------------------------
export const SEED_CFO_COMPLEXITY_RULES: WithId<CFOComplexityRule>[] = [
  { id: "cxr-1", level: "baixa", min_score: 6, max_score: 8, factor: 1.0 },
  { id: "cxr-2", level: "média", min_score: 9, max_score: 12, factor: 1.15 },
  { id: "cxr-3", level: "alta", min_score: 13, max_score: 15, factor: 1.3 },
  { id: "cxr-4", level: "muito_alta", min_score: 16, max_score: 18, factor: 1.5 },
];

// ---------------------------------------------------------------------------
// CFO Segment Rules
// ---------------------------------------------------------------------------
export const SEED_CFO_SEGMENT_RULES: WithId<CFOSegmentRule>[] = [
  { id: "csr-1", segment_type: "mesmo", adjustment: 0 },
  { id: "csr-2", segment_type: "correlato", adjustment: 10 },
  { id: "csr-3", segment_type: "diferente", adjustment: 20 },
  { id: "csr-4", segment_type: "muito_diferente", adjustment: 30 },
];

// ---------------------------------------------------------------------------
// CFO Governance Rules
// ---------------------------------------------------------------------------
export const SEED_CFO_GOVERNANCE_RULES: WithId<CFOGovernanceRule>[] = [
  { id: "cgr-1", governance_type: "simples", fee: 0 },
  { id: "cgr-2", governance_type: "gerencial", fee: 2000 },
  { id: "cgr-3", governance_type: "multiempresa", fee: 5000 },
];

// ---------------------------------------------------------------------------
// Setup Pricing Rules (faturamento MENSAL, shared by Oxy/Coordenador/CFO Setup)
// ---------------------------------------------------------------------------
export const SEED_SETUP_PRICING_RULES: SetupPricingRule[] = [
  { id: "spr-1", label: "0 - 100k", min_revenue: 0, max_revenue: 100000, price_standard: 10000, price_complex: 15000, sort_order: 1 },
  { id: "spr-2", label: "100k - 200k", min_revenue: 100000, max_revenue: 200000, price_standard: 10000, price_complex: 15000, sort_order: 2 },
  { id: "spr-3", label: "200k - 350k", min_revenue: 200000, max_revenue: 350000, price_standard: 10000, price_complex: 15000, sort_order: 3 },
  { id: "spr-4", label: "350k - 500k", min_revenue: 350000, max_revenue: 500000, price_standard: 15000, price_complex: 15000, sort_order: 4 },
  { id: "spr-5", label: "500k - 1M", min_revenue: 500000, max_revenue: 1000000, price_standard: 15000, price_complex: 20000, sort_order: 5 },
  { id: "spr-6", label: "1M - 2.5M", min_revenue: 1000000, max_revenue: 2500000, price_standard: 20000, price_complex: 25000, sort_order: 6 },
  { id: "spr-7", label: "2.5M - 5M", min_revenue: 2500000, max_revenue: 5000000, price_standard: 25000, price_complex: 30000, sort_order: 7 },
  { id: "spr-8", label: "≥ 5M", min_revenue: 5000000, max_revenue: 999999999999, price_standard: 35000, price_complex: 40000, sort_order: 8 },
];

// ---------------------------------------------------------------------------
// Assessoria Pricing Rules
// ---------------------------------------------------------------------------
export const SEED_ASSESSORIA_PRICING_RULES: AssessoriaRule[] = [
  { id: "apr-1", label: "0 - 200k", min_revenue: 0, max_revenue: 200000, base_price: 4000, sort_order: 1 },
  { id: "apr-2", label: "200k - 500k", min_revenue: 200000, max_revenue: 500000, base_price: 4500, sort_order: 2 },
  { id: "apr-3", label: "500k - 1M", min_revenue: 500000, max_revenue: 1000000, base_price: 5000, sort_order: 3 },
  { id: "apr-4", label: "1M - 2.5M", min_revenue: 1000000, max_revenue: 2500000, base_price: 5500, sort_order: 4 },
  { id: "apr-5", label: "≥ 2.5M", min_revenue: 2500000, max_revenue: 999999999999, base_price: 6000, sort_order: 5 },
];

// ---------------------------------------------------------------------------
// Assessoria Settings
// ---------------------------------------------------------------------------
export const SEED_ASSESSORIA_SETTINGS: AssessoriaSettings[] = [
  { id: "as-1", cnpj_adjustment: 500, min_price: 4000, max_price: 6000 },
];

// ---------------------------------------------------------------------------
// Unified lookup
// ---------------------------------------------------------------------------
export const SEED_DATA: Record<string, any[]> = {
  diagnostic_questions: SEED_DIAGNOSTIC_QUESTIONS,
  cost_parameters: SEED_COST_PARAMETERS,
  maturity_levels: SEED_MATURITY_LEVELS,
  outcome_texts: SEED_OUTCOME_TEXTS,
  product_recommendations: SEED_PRODUCT_RECOMMENDATIONS,
  bpo_packages: SEED_BPO_PACKAGES,
  bpo_settings: SEED_BPO_SETTINGS,
  bpo_setup_module: SEED_BPO_SETUP_MODULE,
  cfo_base_rules: SEED_CFO_BASE_RULES,
  cfo_cnpj_rules: SEED_CFO_CNPJ_RULES,
  cfo_complexity_rules: SEED_CFO_COMPLEXITY_RULES,
  cfo_segment_rules: SEED_CFO_SEGMENT_RULES,
  cfo_governance_rules: SEED_CFO_GOVERNANCE_RULES,
  setup_pricing_rules: SEED_SETUP_PRICING_RULES,
  assessoria_pricing_rules: SEED_ASSESSORIA_PRICING_RULES,
  assessoria_settings: SEED_ASSESSORIA_SETTINGS,
};
