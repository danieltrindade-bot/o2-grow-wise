import type { CalcPDFStage } from "./pdf-export";

export interface CronogramaEtapa {
  label: string;
  title: string;
  items: string[];
}

export const BPO_CRONOGRAMA_INTRO =
  "Implantação em 30 dias após a reunião de Kickoff, com reuniões unificadas de Setup + BPO.";

export const BPO_CRONOGRAMA: CronogramaEtapa[] = [
  {
    label: "Kickoff",
    title: "Alinhamento",
    items: [
      "Metodologia O2",
      "Responsáveis e escopo",
      "Canais de comunicação",
      "Acessos: sistemas, ERP e bancos",
    ],
  },
  {
    label: "Semana 1",
    title: "Mapeamento financeiro",
    items: [
      "Contas fixas, tributos e folha",
      "Fornecedores e recebimentos recorrentes",
      "Empréstimos e clientes",
      "Padrão de envio de documentos (48h antes)",
    ],
  },
  {
    label: "Semana 2",
    title: "Estruturação dos processos",
    items: [
      "Revisão de cadastros e plano de contas",
      "Estruturação do ERP",
      "Padronização documental",
      "Fluxos de contas a pagar e a receber",
    ],
  },
  {
    label: "Semana 3",
    title: "Operação assistida",
    items: [
      "Operação com supervisão",
      "Primeiros lançamentos e conciliações",
      "Atualização do fluxo de caixa",
      "Gargalos e ações corretivas",
    ],
  },
  {
    label: "Semana 4",
    title: "Estabilização",
    items: [
      "Validar estabilidade operacional",
      "Aprovar rotina recorrente",
      "Revisão financeira e ERP atualizado",
      "Agendas recorrentes pré-agendadas",
    ],
  },
];

export const BPO_SETUP_DELIVERABLES = [
  "Estudo prévio do cliente",
  "Reunião de kick-off (início onboarding)",
  "Reuniões de mapeamento de dados",
  "Parametrização da plataforma Oxy",
  "Integração com ERP",
  "Treinamento da equipe",
  "Implantação de dashboards",
  "Setup do Agente Gênio",
  "Parametrização de alertas",
  "Conciliação inicial",
  "Plano de contas revisado",
  "Centros de custo definidos",
  "Fluxo de aprovações",
  "Régua de cobrança",
  "Go-live assistido",
];

export function bpoCronogramaStages(): CalcPDFStage[] {
  return BPO_CRONOGRAMA.map((etapa) => ({
    title: `${etapa.label} — ${etapa.title}`,
    description: "",
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
