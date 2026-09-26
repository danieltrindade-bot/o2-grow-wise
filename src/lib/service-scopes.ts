// Conteúdo de apresentação de cada serviço (versão cliente dos escopos
// comerciais). Notas internas do closer, tabelas de preço e assinatura ficam de
// fora. `deliverables` e `stages` continuam alimentando o PDF.

export interface ScopeStage {
  title: string;
  description: string;
  items: string[];
}

export interface ScopePillar {
  title: string;
  subtitle: string;
  items: { label: string; detail: string }[];
}

export interface ScopeNote {
  title: string;
  text: string;
}

export interface ScopePhaseStep {
  label: string;
  title: string;
  items: string[];
  deliverable: string;
}

export interface ServiceDetail {
  what: string;
  deliverables: string[];
  pillarsIntro?: string;
  pillars?: ScopePillar[];
  notes?: ScopeNote[];
  stages?: ScopeStage[];
  phases?: { title: string; intro: string; steps: ScopePhaseStep[]; note?: ScopeNote };
  comparison?: { title: string; headers: [string, string]; rows: [string, string][] };
  areas?: { title: string; intro: string; items: string[] };
  modalities?: { title: string; intro: string; options: { tag: string; name: string; text: string }[] };
  team?: { role: string; text: string }[];
  video?: { title: string; text: string; url: string };
  results?: string[];
  notIncluded?: string[];
  nextSteps?: { title: string; text: string }[];
  cta?: { title: string; text: string };
}

function nextSteps(documentacao: string, kickoff: string) {
  return [
    { title: "Documentação", text: documentacao },
    {
      title: "Assinatura",
      text: "Contrato assinado e pagamento inicial confirmado. É o que ativa o projeto.",
    },
    { title: "Kick-off", text: kickoff },
  ];
}

// Fundação / estruturação financeira compartilhada por CFO, Coordenador e Oxy.
function fundacaoSteps(destino: string, entregaFinal: string): ScopePhaseStep[] {
  return [
    {
      label: "Etapa 01",
      title: "Preparação",
      items: ["Estudo prévio da empresa e do ERP", "Kick-off com o seu time", "Pré-análise do plano de contas"],
      deliverable: "Plano de contas diagnosticado.",
    },
    {
      label: "Etapa 02",
      title: "Mapeamento",
      items: ["Faturamento e recebimento", "Compras, pagamento e conciliação", "Custeio"],
      deliverable: "Correções apontadas por processo.",
    },
    {
      label: "Etapa 03",
      title: "Integração e go-live",
      items: [
        "Ambiente e plano de contas configurados",
        `Seus dados conectados ${destino}`,
        "Dados importados e conferidos",
        "Validação apresentada a você",
        "Treinamento da equipe",
        "Acessos liberados",
      ],
      deliverable: `Integração testada e validada. ${entregaFinal}`,
    },
  ];
}

function pillarsToStages(pillars: ScopePillar[]): ScopeStage[] {
  return pillars.map((p) => ({
    title: p.title,
    description: p.subtitle,
    items: p.items.map((i) => `${i.label}: ${i.detail}`),
  }));
}

function pillarLabels(pillars: ScopePillar[]): string[] {
  return pillars.flatMap((p) => p.items.map((i) => i.label));
}

const BPO_PILLARS: ScopePillar[] = [
  {
    title: "Contas a pagar",
    subtitle: "Tudo lançado, agendado e no seu controle.",
    items: [
      { label: "Lançamento no ERP", detail: "Cada conta com a data de vencimento" },
      { label: "Organização do cronograma financeiro", detail: "O que vence na semana, no mês e no ano" },
      { label: "Agendamentos bancários", detail: "Nas datas que você define, para você aprovar" },
      { label: "Folha no ERP e agendada", detail: "Inclusão e agendamento do pagamento" },
      { label: "Padronização do envio de documentos", detail: "Como e quando cada conta chega" },
    ],
  },
  {
    title: "Contas a receber e conciliação",
    subtitle: "Saber o que entrou, todo dia.",
    items: [
      { label: "Identificação de recebimentos", detail: "Inclusive das maquininhas e adquirentes" },
      { label: "Baixas e ERP atualizado", detail: "Receber em dia no sistema" },
      { label: "Conciliação bancária recorrente", detail: "Extrato e ERP batendo, saldo incluso" },
      { label: "Relatório de inadimplência", detail: "Quem deve, quanto e desde quando" },
      { label: "Ajustes operacionais no ERP", detail: "Inconsistências corrigidas no caminho" },
    ],
  },
  {
    title: "Rotina, relatórios e fechamento",
    subtitle: "O mês fechado e os números à mão.",
    items: [
      { label: "Ritual semanal de alinhamento", detail: "Agenda fixa com você, o ano todo" },
      { label: "Relatório de contas a pagar", detail: "No recorte que você pedir" },
      { label: "Relatório de contas a receber", detail: "O que está para entrar" },
      { label: "Relatório de fluxo de caixa", detail: "Entradas e saídas em um só lugar" },
      { label: "Fechamento mensal até o dia 10", detail: "ERP pronto para a contabilidade" },
      { label: "Atualização da plataforma Oxy", detail: "Seus números visíveis ao fim de cada ciclo" },
    ],
  },
];

const CFO_PILLARS: ScopePillar[] = [
  {
    title: "Condução e decisão",
    subtitle: "Um diretor financeiro sênior dentro da sua rotina.",
    items: [
      { label: "Disponibilidade diária", detail: "Resposta no mesmo dia" },
      { label: "Reunião fixa semanal", detail: "Decisão toda semana" },
      { label: "Comitê mensal com a diretoria", detail: "A direção do ciclo" },
      { label: "Registro de toda reunião", detail: "Ação, dono e prazo" },
    ],
  },
  {
    title: "Clareza sobre os números",
    subtitle: "Os relatórios que a empresa não tem, e a leitura deles.",
    items: [
      { label: "DRE gerencial", detail: "Onde ganha e onde perde" },
      { label: "Fluxo de caixa projetado", detail: "O aperto antes de apertar" },
      { label: "Ciclo financeiro", detail: "Caixa preso na operação" },
      { label: "Necessidade de capital de giro", detail: "Quanto a operação consome" },
      { label: "Ponto de equilíbrio", detail: "Quanto faturar para sobrar" },
      { label: "Orçamento e previsto × realizado", detail: "Rota corrigida no mês" },
      { label: "Cenários", detail: "Viabilidade antes do cheque" },
    ],
  },
  {
    title: "Resultado no caixa",
    subtitle: "Onde a análise vira dinheiro.",
    items: [
      { label: "Interlocução com a contabilidade", detail: "Fechamento sem caixa-preta" },
      { label: "Análise do endividamento", detail: "O custo real de cada dívida" },
      { label: "Reestruturação de passivos", detail: "Dívida cara renegociada" },
      { label: "Captação de recursos", detail: "Empresa apresentável a banco" },
      { label: "Regime tributário", detail: "O enquadramento certo" },
      { label: "Planos de ação", detail: "Melhoria cobrada no comitê" },
      { label: "Equipe financeira interna", detail: "Seu time dentro do método" },
    ],
  },
];

const OXY_PILLARS: ScopePillar[] = [
  {
    title: "Plataforma Oxy",
    subtitle: "A saúde financeira da empresa em um só lugar.",
    items: [
      { label: "Dados do seu ERP conectados", detail: "Sem planilha paralela" },
      { label: "Dashboards customizados", detail: "Os números que importam para o seu negócio" },
    ],
  },
  {
    title: "Gênio · Agente de IA",
    subtitle: "O que era repetitivo passa a rodar sozinho.",
    items: [
      { label: "Automações com IA", detail: "Tarefas recorrentes feitas pelo agente" },
      { label: "Alertas inteligentes de anomalias", detail: "O desvio aparece antes de virar problema" },
      { label: "Visibilidade contínua", detail: "A leitura do financeiro sem esperar o fechamento" },
    ],
  },
  {
    title: "Implantação e treinamento",
    subtitle: "A ferramenta usada, não só instalada.",
    items: [
      { label: "Implantação completa", detail: "Da estruturação dos dados ao go-live" },
      { label: "Treinamento da equipe", detail: "Seu time operando a plataforma" },
      { label: "Acessos para quem decide", detail: "Gestão e diretoria olhando o mesmo número" },
    ],
  },
];

const COORDENADOR_PILLARS: ScopePillar[] = [
  {
    title: "Diagnóstico de pessoas e processos",
    subtitle: "Onde o financeiro quebra, e por quê.",
    items: [
      { label: "Entrevistas com o time", detail: "Financeiro primeiro, depois quem alimenta" },
      { label: "Papéis e responsabilidades", detail: "Cada atividade com um dono" },
      { label: "Mapa de gaps", detail: "Gargalos, retrabalho e riscos por processo" },
      { label: "Capacidade técnica do time", detail: "Quem precisa de treinamento" },
      { label: "Revisão Estrutural", detail: "Problemas, causas-raízes e correções" },
      { label: "Plano de ação priorizado", detail: "Quick wins primeiro, estrutural depois" },
    ],
  },
  {
    title: "Processos padronizados",
    subtitle: "A rotina que deixa de depender de uma pessoa.",
    items: [
      { label: "Conciliação bancária diária", detail: "Saber o que pagou e recebeu, todo dia" },
      { label: "Lançamento por competência", detail: "Toda nota no sistema, na data certa" },
      { label: "Plano de contas padronizado", detail: "A mesma despesa, a mesma conta" },
      { label: "Contas a pagar e a receber", detail: "Fluxo, validação e cobrança organizados" },
      { label: "Alçadas de aprovação", detail: "Quem aprova o quê, por valor" },
      { label: "Checklists operacionais", detail: "Ações diárias, semanais e de fechamento" },
      { label: "Entregas das outras áreas", detail: "Compras e faturamento chegando completos" },
    ],
  },
  {
    title: "Acompanhamento e maturidade",
    subtitle: "O processo seguido toda semana, com nota.",
    items: [
      { label: "Ritual semanal", detail: "Orienta, confere e replaneja" },
      { label: "Inspeção por amostragem", detail: "Lançamentos e documentos conferidos" },
      { label: "Indicador de Maturidade", detail: "Nota de 0 a 100% por processo, mês a mês" },
      { label: "Fechamento de mês assistido", detail: "Pacote pronto para a contabilidade" },
      { label: "Treinamento da equipe", detail: "Seu time dentro do método" },
      { label: "Melhor uso do seu ERP", detail: "Orientação sobre o sistema que você já tem" },
      { label: "Relatório de aderência", detail: "Evolução e recomendações de continuidade" },
    ],
  },
];

const ESTRATEGICO_PILLARS: ScopePillar[] = [
  {
    title: "Análise do negócio",
    subtitle: "O retrato completo da empresa.",
    items: [
      { label: "Análise histórica", detail: "Desempenho financeiro e operacional" },
      { label: "10 áreas-chave avaliadas", detail: "Do financeiro ao capital humano" },
      { label: "Maturidade e posicionamento", detail: "Onde a empresa está hoje" },
    ],
  },
  {
    title: "Diagnóstico",
    subtitle: "O que funciona e o que trava.",
    items: [
      { label: "Pontos fortes", detail: "O que potencializar" },
      { label: "Gargalos", detail: "O que está segurando o resultado" },
      { label: "Oportunidades de crescimento", detail: "Onde está o próximo passo" },
    ],
  },
  {
    title: "Plano e simulação",
    subtitle: "Da análise para a ação.",
    items: [
      { label: "Plano de ação prático", detail: "Prioridades e próximos passos" },
      { label: "Situações críticas endereçadas", detail: "O que reverter primeiro" },
      { label: "Simulação de resultado", detail: "O efeito projetado das melhorias" },
    ],
  },
];

const TRIBUTARIO_PILLARS: ScopePillar[] = [
  {
    title: "Diagnóstico e impacto",
    subtitle: "Quanto a reforma muda o seu resultado.",
    items: [
      { label: "Diagnóstico tributário completo", detail: "Cenário atual × CBS/IBS" },
      { label: "Simulação de impacto nas margens", detail: "Por produto e por serviço" },
      { label: "Impacto do split payment no caixa", detail: "O efeito no fluxo antes de acontecer" },
      { label: "Avaliação do regime tributário ideal", detail: "O enquadramento certo para o novo modelo" },
    ],
  },
  {
    title: "Organização e adequação",
    subtitle: "A empresa pronta para operar no novo modelo.",
    items: [
      { label: "Revisão e correção cadastral", detail: "NCM e NBS corrigidos no ERP" },
      { label: "Revisão de contratos", detail: "Cláusulas de reequilíbrio mapeadas" },
      { label: "Adequação da precificação", detail: "Preço que preserva a margem no novo modelo" },
    ],
  },
  {
    title: "Transição e capacitação",
    subtitle: "Um plano claro até a virada.",
    items: [
      { label: "Plano de transição", detail: "Roadmap 2026 a 2027" },
      { label: "Workshop de capacitação", detail: "Equipe fiscal e financeira preparada" },
      { label: "Relatório final", detail: "Recomendações e plano de ação" },
    ],
  },
];

const TURNAROUND_PILLARS: ScopePillar[] = [
  {
    title: "Gestão e controladoria",
    subtitle: "Decisão lastreada em dado confiável.",
    items: [
      { label: "Plano de contas", detail: "Orientação e auxílio na elaboração" },
      { label: "Fluxo de caixa", detail: "Orientação e auxílio na elaboração" },
      { label: "Apuração e análise do resultado", detail: "Acompanhamento mês a mês" },
      { label: "Indicadores de controladoria", detail: "Acompanhamento contínuo" },
      { label: "Tomada de decisão", detail: "Opiniões sustentadas por números" },
      { label: "Reuniões periódicas", detail: "Alinhamento e evolução do projeto" },
    ],
  },
  {
    title: "Captação de recursos",
    subtitle: "Crédito certo, no banco certo.",
    items: [
      { label: "Necessidade de crédito", detail: "Diagnóstico com documentação atualizada" },
      { label: "Ciclo operacional e financeiro", detail: "Onde o caixa fica preso" },
      { label: "Necessidade de capital de giro", detail: "Quanto a operação consome" },
      { label: "Endividamento bancário", detail: "Análise junto a bancos e instituições" },
      { label: "Fechamento de contratos", detail: "Apoio até a operação sair" },
    ],
  },
  {
    title: "Repactuação de passivos",
    subtitle: "Dívida do tamanho que o caixa aguenta.",
    items: [
      { label: "Mapeamento do endividamento", detail: "Todas as dívidas em uma visão" },
      { label: "Diagnóstico financeiro e contábil", detail: "A real situação da empresa" },
      { label: "Capacidade de desembolso", detail: "Projeção de fluxo de caixa" },
      { label: "Agentes financeiros mapeados", detail: "Com quem negociar e em que ordem" },
      { label: "Contratos de renegociação", detail: "Apoio até o fechamento" },
    ],
  },
];

const ASSESSORIA_STAGES: ScopeStage[] = [
  {
    title: "G1 · Fundação",
    description: "Construir a base: dados confiáveis e primeiros relatórios reais",
    items: [
      "DRE gerencial estruturada com visão por unidade de negócio",
      "Fluxo de caixa realizado mensal estruturado",
      "Calendário fiscal implantado",
    ],
  },
  {
    title: "G2 · Reativa → Controlada",
    description: "Projeção de caixa e controle do ciclo financeiro",
    items: [
      "Fluxo de caixa projetado 30 a 60 dias",
      "DRE mensal com análise de variação",
      "Controle de contas a pagar e a receber + ciclo financeiro (PMR, PMP, PME)",
      "Rotina de fechamento mensal até D+5",
    ],
  },
  {
    title: "G3 · Controlada",
    description: "Margem, rentabilidade e ponto de equilíbrio",
    items: [
      "Análise de capital de giro (NCG)",
      "PMR, PMP e PME monitorados mensalmente",
      "Ponto de equilíbrio mensal calculado",
      "Rentabilidade por produto/serviço e por cliente",
    ],
  },
  {
    title: "G4 · Gerencial",
    description: "Orçamento, KPIs e controle estratégico",
    items: [
      "Orçamento anual formalizado com premissas documentadas",
      "Análise orçado × realizado mensal",
      "Análise de alavancagem operacional (GAO)",
      "Painel de KPIs · dashboard gerencial",
    ],
  },
  {
    title: "G5 · Estratégica",
    description: "Modelagem de longo prazo e governança",
    items: [
      "Modelagem financeira de 3 a 5 anos (3 cenários)",
      "Material pronto para mesa de crédito e investidores",
      "BSC anual e OKR trimestral",
      "Governança estratégica implantada",
    ],
  },
];

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  bpo: {
    what: "A rotina financeira executada todo dia, com dado confiável e no prazo, sem aumentar o seu quadro.",
    pillars: BPO_PILLARS,
    deliverables: pillarLabels(BPO_PILLARS),
    stages: pillarsToStages(BPO_PILLARS),
    notes: [
      {
        title: "Como o trabalho acontece",
        text: "A O2 executa, você decide. O que pagar e quando continua sendo decisão da empresa. O acesso ao banco e ao ERP é nomeado, no nome de quem executa, com registro de tudo o que foi feito, e serve para agendar e consultar. A aprovação do pagamento fica sempre com os donos da conta.",
      },
    ],
    comparison: {
      title: "Equipe interna × BPO Financeiro",
      headers: ["Equipe interna", "BPO Financeiro O2"],
      rows: [
        ["Salário CLT + encargos", "Mensalidade fixa"],
        ["Férias e 13º salário", "Sem custo adicional"],
        ["Rescisões", "Sem passivo trabalhista"],
        ["Ausências param a operação", "Continuidade garantida"],
        ["Conhecimento na cabeça de uma pessoa", "Processo documentado"],
      ],
    },
    notIncluded: [
      "Análise estratégica financeira / análise Oxy",
      "Planejamento financeiro",
      "Gestão estratégica de caixa",
      "Análise de indicadores financeiros",
      "Gestão de gastos e redução de custos",
      "Definição de metas financeiras",
      "Emissão de nota fiscal",
      "Entrada de nota fiscal",
      "Execução contábil e fiscal",
      "Folha de pagamento",
      "Cobrança de clientes",
      "Negociação com inadimplentes",
      "Emissão de boletos",
      "Aprovação de pagamentos em bancos",
    ],
    nextSteps: nextSteps(
      "Documentos da empresa, a relação de CNPJs e as contas bancárias que entram no escopo.",
      "O time de BPO apresenta a metodologia, define responsáveis e canais e solicita os acessos ao ERP e aos bancos.",
    ),
    cta: {
      title: "Financeiro atrasado é decisão tomada no escuro",
      text: "Quanto antes os acessos estiverem liberados, antes a sua rotina financeira passa a rodar em dia, todo dia.",
    },
  },
  cfo: {
    what: "Inteligência financeira executiva para empresas que precisam de visão estratégica sem contratar um diretor financeiro em tempo integral. Define direção, prioridades, metas e indicadores de performance.",
    pillarsIntro: "Três frentes que rodam juntas desde o primeiro mês.",
    pillars: CFO_PILLARS,
    deliverables: pillarLabels(CFO_PILLARS),
    stages: pillarsToStages(CFO_PILLARS),
    phases: {
      title: "Fundação: sem dado confiável, toda decisão vira palpite",
      intro: "É por isso que a O2 começa pela origem, e não pelo relatório.",
      steps: fundacaoSteps("à plataforma", "Plataforma operando no seu time."),
    },
    nextSteps: nextSteps(
      "Documentos da empresa e a relação de CNPJs que entram no escopo.",
      "O seu CFO entra em contato na primeira semana e apresenta o cronograma.",
    ),
    cta: {
      title: "Todo mês sem estrutura é um mês decidido no escuro",
      text: "Quanto antes os acessos estiverem liberados, antes a primeira decisão sai com dado na mesa.",
    },
  },
  oxy: {
    what: "Seus dados financeiros organizados em uma plataforma, com um agente de IA que automatiza tarefas e avisa quando algo sai do normal.",
    pillars: OXY_PILLARS,
    deliverables: pillarLabels(OXY_PILLARS),
    stages: pillarsToStages(OXY_PILLARS),
    video: {
      title: "Veja a Oxy funcionando",
      text: "Um tour pela plataforma, do dado conectado ao painel.",
      url: "https://www.youtube.com/watch?v=o57UfTQiH5Q",
    },
    phases: {
      title: "Estruturação financeira: sem dado confiável, nenhum painel ajuda",
      intro: "Antes de ligar a plataforma, a O2 organiza a origem: plano de contas, processos e os dados do seu sistema.",
      steps: fundacaoSteps("à Oxy", "Oxy + Gênio operando no seu time."),
      note: {
        title: "Condição",
        text: "A estruturação financeira é diluída em 12 parcelas e já está incluída no valor mensal. Você não paga implantação à parte.",
      },
    },
    nextSteps: nextSteps(
      "Documentos da empresa, a relação de CNPJs e o ERP que você usa hoje.",
      "O time da O2 entra em contato na primeira semana, solicita os acessos ao ERP e apresenta o cronograma.",
    ),
    cta: {
      title: "Dado espalhado em planilha não vira decisão",
      text: "Quanto antes os acessos estiverem liberados, antes o seu financeiro aparece inteiro, em um só lugar.",
    },
  },
  assessoria: {
    what: "Uma jornada de maturidade financeira em cinco estágios, da base de dados confiáveis à gestão estratégica completa.",
    deliverables: ASSESSORIA_STAGES.map((s) => `${s.title}: ${s.description}`),
    stages: ASSESSORIA_STAGES,
    notes: [
      {
        title: "Como funciona",
        text: "Cada estágio tem 90 dias e entregas próprias. A empresa começa no estágio em que está hoje, e só avança quando a base do anterior está de pé. É isso que faz a evolução durar.",
      },
    ],
    nextSteps: nextSteps(
      "Documentos da empresa e a relação de CNPJs que entram no escopo.",
      "O seu assessor entra em contato na primeira semana, confirma o estágio de partida e apresenta o plano dos primeiros 90 dias.",
    ),
    cta: {
      title: "Empresa que não sabe onde está não sabe para onde ir",
      text: "Quanto antes o primeiro estágio começar, antes a gestão passa a decidir com número na mesa.",
    },
  },
  coordenador: {
    what: "Coordenação operacional do financeiro: organiza o processo e capacita quem executa, para que a rotina deixe de depender de uma pessoa e o dado nasça certo na origem.",
    pillarsIntro: "Três frentes que rodam juntas desde o primeiro mês.",
    pillars: COORDENADOR_PILLARS,
    deliverables: pillarLabels(COORDENADOR_PILLARS),
    stages: pillarsToStages(COORDENADOR_PILLARS),
    notes: [
      {
        title: "Como o trabalho acontece",
        text: "Orientação, não mão na massa. O Coordenador organiza o processo e capacita quem executa; a execução das rotinas continua com o seu time. Lançamentos contábeis e orientação tributária seguem com a contabilidade, e configuração do ERP com o seu time ou fornecedor, com o Coordenador orientando.",
      },
    ],
    phases: {
      title: "Estruturação financeira: processo organizado precisa de dado na origem",
      intro: "Junto com o diagnóstico, a O2 estrutura a base: plano de contas, dados do seu sistema e a plataforma que dá visibilidade ao que o processo produz.",
      steps: fundacaoSteps("à plataforma", "Plataforma operando no seu time."),
      note: {
        title: "Por que as duas frentes juntas",
        text: "A estruturação olha para o dado: o que sai do sistema e chega à plataforma. O Coordenador olha para as pessoas e o processo: como o trabalho é feito para que esse dado saia certo. Uma sem a outra corrige o relatório e deixa a origem errada.",
      },
    },
    notIncluded: [
      "Execução contábil/fiscal",
      "Implantação técnica de ERP",
      "Auditoria formal",
    ],
    nextSteps: nextSteps(
      "Documentos da empresa, a relação de CNPJs e as áreas que entram no escopo.",
      "O seu Coordenador entra em contato na primeira semana, agenda as entrevistas e apresenta o cronograma.",
    ),
    cta: {
      title: "Processo que depende de uma pessoa para no dia em que ela falta",
      text: "Quanto antes as entrevistas começarem, antes o seu time passa a executar sozinho, e do jeito certo.",
    },
  },
  estrategico: {
    what: "Uma análise profunda e completa do seu negócio, para identificar onde melhorar e levar a empresa ao próximo nível, com mais controle e lucratividade.",
    pillars: ESTRATEGICO_PILLARS,
    deliverables: pillarLabels(ESTRATEGICO_PILLARS),
    stages: pillarsToStages(ESTRATEGICO_PILLARS),
    areas: {
      title: "Dez áreas avaliadas, um plano integrado",
      intro: "O diagnóstico olha a empresa inteira, porque o problema de uma área quase sempre nasce em outra.",
      items: [
        "Financeiro",
        "Tecnologia",
        "Planejamento",
        "Contábil",
        "Controladoria",
        "Fiscal",
        "Comercial",
        "Marketing",
        "Societário",
        "Capital humano",
      ],
    },
    results: [
      "Identificação profissional dos problemas atuais em todas as áreas do negócio.",
      "Maior clareza para tomar decisões com base em dados fidedignos, e não em sentimento.",
      "Plano de ação técnico e calculado para melhorias operacionais, financeiras, comerciais e de gestão.",
      "Melhoria integrada dos resultados econômico-financeiros e operacionais, com mais sinergia entre as áreas.",
    ],
    nextSteps: nextSteps(
      "Documentos da empresa e a relação de CNPJs que entram no escopo.",
      "O time da O2 entra em contato na primeira semana, agenda as entrevistas e solicita os dados históricos.",
    ),
    cta: {
      title: "Decidir sem diagnóstico é apostar",
      text: "Quanto antes a análise começar, antes você sabe exatamente onde agir primeiro.",
    },
  },
  tributario: {
    what: "Adequação da sua empresa à Reforma Tributária (EC 132/2023 + LC 214/2025): do impacto nas margens ao plano de transição.",
    pillars: TRIBUTARIO_PILLARS,
    deliverables: pillarLabels(TRIBUTARIO_PILLARS),
    stages: pillarsToStages(TRIBUTARIO_PILLARS),
    notes: [
      {
        title: "Contexto",
        text: "A Reforma Tributária (EC 132/2023 e LC 214/2025) troca tributos, muda cálculo de preço e antecipa o recolhimento com o split payment. Quem se organiza antes protege a margem; quem espera descobre o impacto no caixa.",
      },
    ],
    modalities: {
      title: "Duas formas de contratar",
      intro: "Escolha entre o diagnóstico com a organização completa ou apenas o diagnóstico.",
      options: [
        {
          tag: "Modalidade completa",
          name: "Diagnóstico + Organização Tributária",
          text: "Os três pilares: o diagnóstico do impacto, a adequação de cadastros, contratos e preços, e o plano de transição com capacitação da equipe.",
        },
        {
          tag: "Modalidade diagnóstico",
          name: "Apenas Diagnóstico Tributário",
          text: "O raio-x do impacto da reforma na sua empresa, com relatório de recomendações. A execução das adequações fica com o seu time.",
        },
      ],
    },
    nextSteps: nextSteps(
      "Documentos da empresa, a relação de CNPJs, o regime tributário atual e o ERP utilizado.",
      "O especialista da O2 entra em contato na primeira semana, solicita os dados fiscais e apresenta o cronograma.",
    ),
    cta: {
      title: "A reforma não espera a empresa se organizar",
      text: "Quanto antes o diagnóstico começar, mais tempo você tem para ajustar preço e contrato antes da virada.",
    },
  },
  valuation: {
    what: "Valorize a história que você dedicou tempo e energia e maximize o valor do seu negócio através de um trabalho técnico e profissional de Valuation. Projeto de até 60 dias, com emissão de laudo técnico.",
    deliverables: [
      "Análise de Relatórios Contábeis",
      "Estudo de Mercado, Benchmarks e Pares",
      "Entendimento do Planejamento Estratégico",
      "Modelagem Financeira (DCF e Múltiplos)",
      "Avaliação Patrimonial Contábil e Gerencial",
      "Emissão do Laudo Técnico de Valuation",
    ],
    stages: [
      {
        title: "Análise de Relatórios Contábeis",
        description: "Revisão detalhada dos demonstrativos financeiros da empresa",
        items: [
          "Revisão de DRE, Balanço Patrimonial, Fluxo de Caixa, etc.",
          "Identificação da saúde financeira e dos pontos de atenção",
        ],
      },
      {
        title: "Estudo de Mercado, Benchmarks e Pares",
        description: "Comparação da empresa com concorrentes diretos e indiretos",
        items: [
          "Uso de benchmarks financeiros e operacionais do mercado",
          "Identificação de empresas similares (pares) para balizar o valuation",
        ],
      },
      {
        title: "Entendimento do Planejamento Estratégico",
        description: "Reuniões com os sócios sobre a visão e os objetivos de longo prazo",
        items: [
          "Compreensão da visão e dos objetivos de longo prazo da empresa",
          "Projeção do crescimento e das metas futuras no valuation",
        ],
      },
      {
        title: "Modelagem Financeira (DCF e Múltiplos)",
        description: "Projeções financeiras detalhadas para determinar o valor justo",
        items: [
          "Fluxo de Caixa Descontado (DCF)",
          "Avaliação por Múltiplos",
          "Valor justo da empresa com base em diferentes cenários",
        ],
      },
      {
        title: "Avaliação Patrimonial Contábil e Gerencial",
        description: "Verificação do valor dos ativos e passivos da empresa",
        items: [
          "Visão contábil, a partir do balanço",
          "Visão gerencial, a valor de mercado dos ativos (imóveis, máquinas, etc.)",
        ],
      },
      {
        title: "Emissão do Laudo Técnico de Valuation",
        description: "Relatório técnico formal com a avaliação completa da empresa",
        items: [
          "Avaliação completa e detalhada da empresa",
          "Justificativa do valor encontrado com base nas análises anteriores",
        ],
      },
    ],
    results: [
      "Tomada de decisão estratégica",
      "Preparação para Fusões e Aquisições",
      "Captação de Investimentos",
      "Mudança na estrutura societária",
      "Maximização do valor de uma venda",
    ],
  },
  turnaround: {
    what: "Captação de recursos, repactuação de passivos, gestão e controladoria, trabalhando juntas para devolver fôlego ao caixa e sustentabilidade ao negócio.",
    pillars: TURNAROUND_PILLARS,
    deliverables: pillarLabels(TURNAROUND_PILLARS),
    stages: pillarsToStages(TURNAROUND_PILLARS),
    team: [
      { role: "Partner", text: "Condução do projeto e das negociações" },
      { role: "CFO", text: "Gestão financeira e controladoria" },
      { role: "Analista", text: "Análises, projeções e documentação" },
    ],
    notes: [
      {
        title: "Formato",
        text: "Projeto de 12 meses com equipe sênior dedicada para recuperar o equilíbrio operacional e financeiro da empresa.",
      },
    ],
    nextSteps: nextSteps(
      "Documentos da empresa, a relação de CNPJs, as dívidas e contratos bancários vigentes.",
      "A equipe da O2 entra em contato na primeira semana, mapeia a situação e define as prioridades dos primeiros 90 dias.",
    ),
    cta: {
      title: "Em crise, cada semana custa mais caro",
      text: "Quanto antes o mapeamento começar, mais opções de negociação continuam na mesa.",
    },
  },
};
