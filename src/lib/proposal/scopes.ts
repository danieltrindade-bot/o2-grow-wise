// Catálogo dos textos que aparecem na proposta em HTML: o papel de cada
// serviço e o escopo agrupado por natureza da entrega.
//
// É o único lugar para editar esses textos. A lista plana de SERVICE_DETAILS
// continua servindo o PDF, que é o material técnico do executivo — aqui o
// agrupamento existe porque o cliente varre rótulos antes de ler o detalhe.

import type { ProposalService, ScopeItem } from "./model";

export const PROPOSAL_ROLES: Record<string, string> = {
  cfo: "Liderança estratégica: define direção, prioridade, metas e responde pelo resultado financeiro.",
  coordenador:
    "Execução tática: transforma o plano em rotina cumprida e garante que o dado nasce certo na origem.",
  bpo: "Execução operacional: assume as rotinas do dia a dia com padrão e cadência, liberando a gestão.",
  assessoria:
    "Inteligência financeira: estrutura os relatórios e o orçamento que sustentam a decisão.",
  turnaround:
    "Recuperação: reestrutura passivos e resultado para devolver a empresa ao ponto de equilíbrio.",
};

export const PROPOSAL_SCOPES: Record<string, ScopeItem[]> = {
  cfo: [
    {
      label: "Rituais",
      text: "disponibilidade diária, reunião semanal, comitê estratégico mensal",
    },
    { label: "Construção", text: "DRE, Fluxo de Caixa, Ciclo Financeiro, forecast 30/60/90" },
    { label: "Estratégia", text: "capital de giro, endividamento, margem e rentabilidade" },
    {
      label: "Suporte",
      text: "captação de recursos, reestruturação de passivos, interlocução com a contabilidade",
    },
  ],
  coordenador: [
    { label: "Diagnóstico", text: "pessoas e processos financeiros mapeados de ponta a ponta" },
    { label: "Padronização", text: "rotinas críticas de CP, CR e conciliação, com checklists" },
    {
      label: "Rituais",
      text: "alinhamento semanal com a equipe e acompanhamento de 2 fechamentos",
    },
    { label: "Controle", text: "relatório de aderência e Indicador de Maturidade Operacional" },
  ],
  bpo: [
    { label: "Rotinas", text: "contas a pagar, contas a receber e conciliação bancária" },
    {
      label: "ERP",
      text: "lançamento e atualização financeira, agendamentos e ajustes de processo",
    },
    {
      label: "Relatórios",
      text: "fluxo de caixa, inadimplência, contas a pagar e contas a receber",
    },
    {
      label: "Organização",
      text: "cronograma financeiro, padronização de documentos e atualização da Oxy",
    },
  ],
  assessoria: [
    { label: "Diagnóstico", text: "análise estratégica aprofundada do negócio" },
    { label: "Construção", text: "DRE Gerencial, Fluxo de Caixa Realizado e centros de custo" },
    { label: "Análise", text: "margem por produto e por cliente" },
    { label: "Planejamento", text: "orçamento anual e acompanhamento mensal personalizado" },
  ],
  turnaround: [
    { label: "Estratégia", text: "plano de recuperação do negócio com prioridades claras" },
    { label: "Equilíbrio", text: "ponto de equilíbrio operacional e financeiro" },
    {
      label: "Capital",
      text: "captação de recursos estratégicos e credibilidade junto ao mercado",
    },
    { label: "Risco", text: "mitigação de riscos de pausa e perspectiva de retomada" },
  ],
};

/**
 * Monta o serviço da proposta a partir do catálogo. `monthly` deve ser a
 * mensalidade de tabela — sem desconto — porque o desconto entra como condição
 * de fechamento e precisa do valor cheio para o de-para.
 */
export function proposalService(
  key: string,
  name: string,
  monthly: number,
  overrides: Partial<ProposalService> = {},
): ProposalService {
  return {
    key,
    name,
    role: PROPOSAL_ROLES[key] ?? "",
    monthly,
    scope: PROPOSAL_SCOPES[key] ?? [],
    ...overrides,
  };
}
