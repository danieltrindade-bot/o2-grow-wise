// Gera amostras da proposta em HTML nos dois modos, para inspeção visual.
//   npx vite-node scripts/preview-proposal.ts
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { renderProposalHTML } from "../src/lib/proposal/html";
import type { ProposalModel } from "../src/lib/proposal/model";

const CFO = {
  key: "cfo",
  name: "CFO as a Service",
  role: "Liderança estratégica: define direção, prioridade, metas e responde pelo resultado financeiro do grupo.",
  monthly: 17491.16,
  scope: [
    "Disponibilidade diária, reunião semanal e comitê estratégico mensal",
    "Construção e análise do DRE e do Fluxo de Caixa",
    "Gestão de capital de giro e endividamento",
    "Suporte na captação de recursos e reestruturação de passivos",
  ],
};

const COORD = {
  key: "coordenador",
  name: "Coordenador as a Service",
  role: "Execução tática: transforma o plano em rotina cumprida e garante que o dado nasce certo na origem.",
  monthly: 7202.25,
  scope: [
    "Diagnóstico de pessoas e processos financeiros",
    "Padronização das rotinas críticas: CP, CR e conciliação",
    "Checklists operacionais e ritual semanal com a equipe",
    "Relatório de aderência e Indicador de Maturidade Operacional",
  ],
};

const base: ProposalModel = {
  client: {
    name: "Bethel Educação",
    monthlyRevenue: 5_000_000,
    cnpjCount: 3,
    profile: "Integrado · Complexidade alta",
  },
  date: "2026-08-14",
  services: [CFO, COORD],
  setup: { label: "Estruturação Financeira (Setup inicial)", total: 46000, installments: 12 },
  pains: [
    {
      title: "Nenhuma liderança financeira acima da operação",
      description:
        "A equipe executa, mas não há quem defina prioridade, cobre cadência e responda pelo resultado do grupo.",
      quote:
        "Falta de liderança financeira e governança precisa dificulta a gestão estratégica do fluxo de caixa.",
    },
    {
      title: "Números que não passam na conferência",
      description:
        "Sem base sanitizada, o resultado consolidado é estimativa — não informação de decisão.",
      quote:
        "Dificuldades na conferência de números e na gestão estratégica do fluxo de caixa e dívidas.",
    },
  ],
};

const cases: Array<[string, ProposalModel]> = [
  [
    "proposta-amostra-com-condicao.html",
    { ...base, closing: { monthly: 15000, setupTotal: 30000, installments: 12 } },
  ],
  ["proposta-amostra-sem-condicao.html", base],
  ["proposta-amostra-servico-unico.html", { ...base, services: [CFO], pains: undefined }],
];

for (const [name, model] of cases) {
  const path = join(homedir(), "Downloads", name);
  writeFileSync(path, renderProposalHTML(model), "utf8");
  console.log("gerado:", path);
}
