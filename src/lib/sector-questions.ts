import type { OptionKey } from "./diagnostic-questions";

export type Sector = "industria" | "comercio" | "servico" | "startup" | "governo";

export const SECTORS: { value: Sector; label: string }[] = [
  { value: "industria", label: "Indústria" },
  { value: "comercio", label: "Comércio" },
  { value: "servico", label: "Serviço" },
  { value: "startup", label: "Startup" },
  { value: "governo", label: "Governo" },
];

export const SECTOR_LABELS: Record<Sector, string> = Object.fromEntries(
  SECTORS.map((s) => [s.value, s.label]),
) as Record<Sector, string>;

interface QuestionOverride {
  text: string;
  options?: Partial<Record<OptionKey, string>>;
}

interface ResultOverride {
  /** Substitui o label curto do "Ponto de atenção" na tela de resultados. */
  alert?: string;
  /** Substitui o label da linha de perda, por cor de gatilho. */
  costLabel?: Partial<Record<OptionKey, string>>;
}

interface SectorContent {
  questions: Record<string, QuestionOverride>;
  results: Record<string, ResultOverride>;
}

/**
 * Overrides por setor. Mantêm os MESMOS ids de pergunta e a MESMA semântica
 * verde/amarelo/vermelho — só reescrevem o texto para o vocabulário do setor.
 * Assim score, cálculo de perda e recomendação de produto continuam intactos.
 *
 * Perguntas direcionadas (5 das 10): financial:q1, financial:q2,
 * commercial:q1, commercial:q3, commercial:q5.
 */
export const SECTOR_CONTENT: Record<Sector, SectorContent> = {
  industria: {
    questions: {
      "financial:q1": {
        text: "Você tem previsão de D+90, no mínimo, do recebível dos seus pedidos de produção e contratos faturados?",
        options: {
          green: "Sim, acompanhamos por pedido/contrato",
          yellow: "Temos uma ideia, mas não consolidado",
          red: "Não conseguiríamos responder",
        },
      },
      "financial:q2": {
        text: "Quando um cliente industrial atrasa o pagamento de um pedido faturado, existe régua de cobrança com responsável e canal definidos?",
        options: {
          green: "Sim, estruturada por cliente",
          yellow: "Fazemos algo, mas é informal",
          red: "Não temos / Não sei",
        },
      },
      "commercial:q1": {
        text: "A empresa sabe quais linhas de produto e clientes geram mais margem — descontando matéria-prima, produção e logística?",
        options: {
          green: "Sim, margem por SKU/linha",
          yellow: "Sabemos parcialmente",
          red: "Não medimos a margem real",
        },
      },
      "commercial:q3": {
        text: "Os prazos de pagamento são definidos pela sua empresa ou ditados pelas grandes contas no fechamento do pedido?",
        options: {
          green: "A empresa define os prazos",
          yellow: "Negociamos caso a caso",
          red: "A grande conta dita o prazo",
        },
      },
      "commercial:q5": {
        text: "Já aconteceu de fechar um grande volume de pedidos e faltar caixa para comprar insumo e produzir?",
        options: {
          green: "Nunca aconteceu",
          yellow: "Aconteceu raramente",
          red: "Sim, é recorrente",
        },
      },
    },
    results: {
      "financial:q1": { alert: "Recebível de pedidos sem previsão", costLabel: { red: "Perda por atraso no recebível de pedidos faturados", yellow: "Recebível de pedidos parcialmente monitorado" } },
      "financial:q2": { alert: "Cobrança de pedidos sem régua", costLabel: { red: "Inadimplência de clientes industriais sem controle", yellow: "Inadimplência de pedidos parcialmente controlada" } },
      "commercial:q1": { alert: "Margem por linha não medida", costLabel: { red: "Linhas/SKUs sem margem priorizada" } },
      "commercial:q3": { alert: "Grande conta dita o prazo", costLabel: { red: "Capital de giro imobilizado em prazos de grandes contas" } },
      "commercial:q5": { alert: "Produção sem lastro de caixa", costLabel: { red: "Crédito emergencial para bancar produção", yellow: "Risco de descasamento pedidos x caixa" } },
    },
  },

  comercio: {
    questions: {
      "financial:q1": {
        text: "Você tem previsão de D+90, no mínimo, do seu recebível — vendas no cartão, crediário e prazos com fornecedores?",
        options: {
          green: "Sim, controle por canal de venda",
          yellow: "Temos uma ideia, mas não consolidado",
          red: "Não conseguiríamos responder",
        },
      },
      "financial:q2": {
        text: "Quando uma venda a prazo (crediário/fiado) não é paga, existe régua de cobrança definida com responsável e canal?",
        options: {
          green: "Sim, temos isso estruturado",
          yellow: "Fazemos algo, mas é informal",
          red: "Não temos / Não sei",
        },
      },
      "commercial:q1": {
        text: "A empresa sabe quais produtos geram mais lucro por unidade — não só os que mais vendem, mas os que dão mais margem com o giro?",
        options: {
          green: "Sim, margem por produto/categoria",
          yellow: "Sabemos parcialmente",
          red: "Não cruzamos giro com margem",
        },
      },
      "commercial:q3": {
        text: "O prazo das maquininhas e dos fornecedores trabalha a favor do seu caixa, ou você recebe depois e paga antes?",
        options: {
          green: "Prazos alinhados a favor do caixa",
          yellow: "Equilibrado, mas sem gestão ativa",
          red: "Pago antes de receber",
        },
      },
      "commercial:q5": {
        text: "Já aconteceu de vender muito numa data sazonal (Natal, Black Friday) e apertar o caixa no mês seguinte?",
        options: {
          green: "Nunca aconteceu",
          yellow: "Aconteceu raramente",
          red: "Sim, a cada pico de venda",
        },
      },
    },
    results: {
      "financial:q1": { alert: "Recebível de vendas sem previsão", costLabel: { red: "Perda por recebíveis de venda não monitorados", yellow: "Recebível de vendas parcialmente monitorado" } },
      "financial:q2": { alert: "Crediário sem régua de cobrança", costLabel: { red: "Inadimplência de crediário sem controle", yellow: "Inadimplência de crediário parcialmente controlada" } },
      "commercial:q1": { alert: "Giro x margem não medido", costLabel: { red: "Produtos sem priorização por margem" } },
      "commercial:q3": { alert: "Recebe depois, paga antes", costLabel: { red: "Capital de giro imobilizado no descasamento de prazos" } },
      "commercial:q5": { alert: "Sazonalidade aperta o caixa", costLabel: { red: "Crédito emergencial pós-pico de venda", yellow: "Risco de descasamento venda x caixa na sazonalidade" } },
    },
  },

  servico: {
    questions: {
      "financial:q1": {
        text: "Você tem previsão de D+90, no mínimo, do recebível dos seus contratos recorrentes e projetos em andamento?",
        options: {
          green: "Sim, por contrato/projeto",
          yellow: "Temos uma ideia, mas não consolidado",
          red: "Não conseguiríamos responder",
        },
      },
      "financial:q2": {
        text: "Quando um cliente de contrato recorrente atrasa a mensalidade, existe régua de cobrança com responsável e canal definidos?",
        options: {
          green: "Sim, temos isso estruturado",
          yellow: "Fazemos algo, mas é informal",
          red: "Não temos / Não sei",
        },
      },
      "commercial:q1": {
        text: "A empresa sabe quais contratos e clientes dão mais margem — descontando as horas e o custo da equipe alocada?",
        options: {
          green: "Sim, margem por contrato/hora",
          yellow: "Sabemos parcialmente",
          red: "Não medimos custo por hora/projeto",
        },
      },
      "commercial:q3": {
        text: "As condições e reajustes dos contratos são definidos pela sua empresa ou o cliente impõe prazo e preço?",
        options: {
          green: "A empresa define as condições",
          yellow: "Negociamos caso a caso",
          red: "O cliente impõe as condições",
        },
      },
      "commercial:q5": {
        text: "Já aconteceu de fechar vários projetos/contratos ao mesmo tempo e faltar caixa para bancar a equipe alocada?",
        options: {
          green: "Nunca aconteceu",
          yellow: "Aconteceu raramente",
          red: "Sim, é recorrente",
        },
      },
    },
    results: {
      "financial:q1": { alert: "Recebível de contratos sem previsão", costLabel: { red: "Perda por recebíveis de contratos não monitorados", yellow: "Recebível de contratos parcialmente monitorado" } },
      "financial:q2": { alert: "Mensalidade sem régua de cobrança", costLabel: { red: "Inadimplência de mensalidades sem controle", yellow: "Inadimplência de mensalidades parcialmente controlada" } },
      "commercial:q1": { alert: "Custo por hora/projeto não medido", costLabel: { red: "Contratos sem margem por hora priorizada" } },
      "commercial:q3": { alert: "Cliente impõe as condições", costLabel: { red: "Capital de giro imobilizado em prazos longos de contrato" } },
      "commercial:q5": { alert: "Equipe sem lastro de caixa", costLabel: { red: "Crédito emergencial para bancar equipe alocada", yellow: "Risco de descasamento projetos x caixa" } },
    },
  },

  startup: {
    questions: {
      "financial:q1": {
        text: "Você tem visibilidade de D+90 do seu caixa — MRR a receber, runway e queima projetada?",
        options: {
          green: "Sim, runway e MRR controlados",
          yellow: "Temos uma ideia, mas não consolidado",
          red: "Não conseguiríamos responder",
        },
      },
      "financial:q2": {
        text: "Quando um cliente de assinatura deixa de pagar, existe régua de cobrança e tratamento do churn financeiro?",
        options: {
          green: "Sim, temos isso estruturado",
          yellow: "Fazemos algo, mas é informal",
          red: "Não temos / Não sei",
        },
      },
      "commercial:q1": {
        text: "A empresa sabe quais clientes/planos têm melhor unit economics — LTV x CAC, não só o que mais fatura?",
        options: {
          green: "Sim, acompanhamos unit economics",
          yellow: "Sabemos parcialmente",
          red: "Não medimos LTV/CAC",
        },
      },
      "commercial:q3": {
        text: "Os termos de pagamento (anual antecipado x mensal) são definidos por você ou pelo cliente na negociação?",
        options: {
          green: "A empresa define os termos",
          yellow: "Negociamos caso a caso",
          red: "O cliente define os termos",
        },
      },
      "commercial:q5": {
        text: "Já aconteceu de crescer rápido em vendas e a queima de caixa ameaçar o runway no mês seguinte?",
        options: {
          green: "Nunca aconteceu",
          yellow: "Aconteceu raramente",
          red: "Sim, é recorrente",
        },
      },
    },
    results: {
      "financial:q1": { alert: "Runway sem visibilidade", costLabel: { red: "Perda por MRR a receber não monitorado", yellow: "MRR a receber parcialmente monitorado" } },
      "financial:q2": { alert: "Churn financeiro sem régua", costLabel: { red: "Inadimplência de assinaturas sem controle", yellow: "Inadimplência de assinaturas parcialmente controlada" } },
      "commercial:q1": { alert: "Unit economics não medido", costLabel: { red: "Planos sem priorização por LTV/CAC" } },
      "commercial:q3": { alert: "Cliente define os termos", costLabel: { red: "Capital de giro imobilizado em recebimento mensal" } },
      "commercial:q5": { alert: "Crescimento queima o runway", costLabel: { red: "Crédito emergencial para sustentar a queima", yellow: "Risco de descasamento crescimento x runway" } },
    },
  },

  governo: {
    questions: {
      "financial:q1": {
        text: "Você tem previsão de D+90, no mínimo, dos seus recebíveis — empenhos, notas empenhadas e repasses dos órgãos?",
        options: {
          green: "Sim, por empenho/contrato",
          yellow: "Temos uma ideia, mas não consolidado",
          red: "Não conseguiríamos responder",
        },
      },
      "financial:q2": {
        text: "Quando um órgão atrasa o pagamento de uma nota empenhada, existe processo definido de acompanhamento e cobrança?",
        options: {
          green: "Sim, temos isso estruturado",
          yellow: "Fazemos algo, mas é informal",
          red: "Não temos / Não sei",
        },
      },
      "commercial:q1": {
        text: "A empresa sabe quais contratos e licitações dão mais margem real — descontando custo de execução e prazo de recebimento?",
        options: {
          green: "Sim, margem por contrato/edital",
          yellow: "Sabemos parcialmente",
          red: "Não medimos a margem real",
        },
      },
      "commercial:q3": {
        text: "Você precifica o custo do prazo de recebimento ao participar de um edital, ou aceita o prazo do órgão sem projetar o impacto no caixa?",
        options: {
          green: "Precificamos o custo do prazo",
          yellow: "Às vezes consideramos",
          red: "Aceitamos o prazo sem projetar",
        },
      },
      "commercial:q5": {
        text: "Já aconteceu de ganhar várias licitações e faltar capital de giro para executar enquanto o repasse não chega?",
        options: {
          green: "Nunca aconteceu",
          yellow: "Aconteceu raramente",
          red: "Sim, é recorrente",
        },
      },
    },
    results: {
      "financial:q1": { alert: "Empenhos sem previsão de recebimento", costLabel: { red: "Perda por empenhos/repasses não monitorados", yellow: "Empenhos parcialmente monitorados" } },
      "financial:q2": { alert: "Nota empenhada sem acompanhamento", costLabel: { red: "Atraso de repasse sem processo de cobrança", yellow: "Acompanhamento de repasse parcial" } },
      "commercial:q1": { alert: "Margem por contrato não medida", costLabel: { red: "Contratos/editais sem margem real priorizada" } },
      "commercial:q3": { alert: "Prazo do edital não precificado", costLabel: { red: "Capital de giro imobilizado no prazo do edital" } },
      "commercial:q5": { alert: "Execução sem capital de giro", costLabel: { red: "Crédito emergencial para executar antes do repasse", yellow: "Risco de descasamento execução x repasse" } },
    },
  },
};

export function sectorQuestion(
  sector: Sector | "" | undefined,
  qid: string,
): QuestionOverride | undefined {
  if (!sector) return undefined;
  return SECTOR_CONTENT[sector]?.questions[qid];
}

export function sectorResult(
  sector: Sector | "" | undefined,
  qid: string,
): ResultOverride | undefined {
  if (!sector) return undefined;
  return SECTOR_CONTENT[sector]?.results[qid];
}
