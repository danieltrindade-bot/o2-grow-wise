import type { CalcPDFStage } from "./pdf-export";

export interface CronogramaEtapa {
  label: string;
  title: string;
  items: string[];
  deliverable?: string;
}

export const BPO_CRONOGRAMA_INTRO =
  "Implantação em 30 dias após o kick-off. O começo é sobre comunicação: combinar como cada documento chega. Com isso definido, a execução não trava.";

export const BPO_CRONOGRAMA: CronogramaEtapa[] = [
  {
    label: "Kick-off e semana 1",
    title: "Mapeamento",
    items: [
      "Responsáveis, escopo e canais definidos",
      "Acessos ao ERP e aos bancos",
      "Contas fixas, fornecedores, tributos, folha e empréstimos",
      "Recebimentos e clientes mapeados",
    ],
    deliverable: "Rotina financeira mapeada e envio de documentos combinado.",
  },
  {
    label: "Semana 2",
    title: "Estruturação",
    items: [
      "Cadastros e plano de contas revisados",
      "ERP estruturado para a operação",
      "Datas de envio e padrão documental",
      "Fluxos de pagar e receber desenhados",
    ],
    deliverable: "ERP e fluxos prontos para operar.",
  },
  {
    label: "Semanas 3 e 4",
    title: "Operação assistida",
    items: [
      "Lançamentos e conciliações com supervisão",
      "Fluxo de caixa atualizado",
      "Inconsistências corrigidas",
      "Reunião de fechamento e agendas recorrentes",
    ],
    deliverable: "Rotina estável e aprovada. Operação recorrente começa.",
  },
];

export const BPO_SETUP_DELIVERABLES = [
  "Estudo prévio do cliente",
  "Reunião de kick-off (início onboarding)",
  "Reuniões de mapeamento de dados",
  "Análise e detalhamento do Plano de Contas",
  "Análise e detalhamento do Faturamento e Contas a Receber",
  "Análise e detalhamento de Compra, Despesas e Contas a Pagar",
  "Análise e detalhamento da Conciliação Bancária",
  "Análise e detalhamento da apuração de CPV/CMV",
  "Apontamento das ações de correção e/ou melhorias para a geração de dados fidedignos",
  "Acompanhamento e implementação destas ações na recorrência",
  "Desenvolvimento das integrações do ERP com a Oxy (Plataforma inteligente da O2 Inc.)",
  "Integração final ERP & Oxy (Via API, Web Scraping ou importação de arquivos csv)",
  "Validação e Double-check dos dados na Oxy",
  "Apresentação e treinamento da Oxy",
  "Liberação dos Acessos para os usuários da empresa",
];

export function bpoCronogramaStages(): CalcPDFStage[] {
  return BPO_CRONOGRAMA.map((etapa) => ({
    title: `${etapa.label}: ${etapa.title}`,
    description: etapa.deliverable ?? "",
    items: etapa.items,
  }));
}

/** Setup (Oxy + Gênio) seguido do cronograma faseado — usado no PDF. */
export function bpoImplantacaoStages(): CalcPDFStage[] {
  return [
    {
      title: "Setup — o que inclui",
      description: "Entregáveis da implantação, incluindo parametrização da Oxy e Agente Gênio.",
      items: BPO_SETUP_DELIVERABLES,
    },
    ...bpoCronogramaStages(),
  ];
}
