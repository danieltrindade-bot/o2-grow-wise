"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceDetail {
  what: string;
  deliverables: string[];
  notIncluded?: string[];
  stages?: { title: string; description: string; items: string[] }[];
}

const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  bpo: {
    what: "Terceirização completa da operação financeira. A O2 assume contas a pagar, contas a receber, conciliação bancária, faturamento e relatórios gerenciais — liberando sua equipe para focar no core business.",
    deliverables: [
      "Contas a pagar e a receber operadas diariamente",
      "Conciliação bancária semanal",
      "Régua de cobrança com cadência definida",
      "Fluxo de aprovação de compras com alçadas",
      "Relatório gerencial mensal (DRE + Fluxo de Caixa)",
      "Implantação da plataforma Oxy + Agente Gênio",
      "Dashboards em tempo real",
    ],
  },
  cfo: {
    what: "Inteligência financeira executiva para empresas que precisam de visão estratégica sem contratar um diretor financeiro em tempo integral. Define direção, prioridades, metas e indicadores de performance.",
    deliverables: [
      "Planejamento financeiro e orçamentário",
      "Análise de margem e rentabilidade",
      "Gestão de capital de giro e endividamento",
      "Indicadores de performance (KPIs financeiros)",
      "Governança financeira e reporte executivo",
      "Forecast de caixa 30/60/90 dias",
      "Acompanhamento de metas e desvios",
    ],
    stages: [
      {
        title: "Gestão Financeira Estratégica Contínua",
        description: "Suporte executivo de alto nível para a gestão financeira estratégica, com acompanhamento diário e rituais de governança",
        items: [
          "Disponibilidade diária",
          "Reunião Fixa semanal",
          "Comitê Estratégico Mensal",
          "Report semanal do status do projeto O2 Inc.",
        ],
      },
      {
        title: "Análise e Planejamento Avançado",
        description: "Construção e análise de relatórios financeiros complexos e auxílio no planejamento orçamentário e estratégico de negócios",
        items: [
          "Construção e Análise do DRE",
          "Construção e Análise do Fluxo de Caixa",
          "Construção e Análise do Ciclo Financeiro",
          "Análise de relatórios financeiros",
          "Auxílio na construção do Planejamento orçamentário",
          "Análise estratégica de negócios",
        ],
      },
      {
        title: "Suporte Estratégico para o Negócio",
        description: "Orientação em reestruturação de passivos, captação de recursos, e coordenação de melhorias, atuando como um parceiro estratégico",
        items: [
          "Interlocução com a Contabilidade",
          "Suporte na captação de Recursos",
          "Suporte na Reestruturação dos Passivos",
          "Coordenação de planos de ação para melhoria de processos e de resultado financeiro",
          "Suporte na implementação das melhorias no ERP",
          "Suporte na construção e treinamento da equipe financeira",
          "Acompanhamento da Implementação Plataforma Oxy",
        ],
      },
    ],
  },
  oxy: {
    what: "Plataforma de dados financeiros em tempo real combinada com Agente de IA. Automatiza conciliação, gera alertas inteligentes e entrega visibilidade instantânea sobre a saúde financeira da empresa.",
    deliverables: [
      "Plataforma Oxy com dados em tempo real",
      "Agente IA Gênio para automações",
      "Conciliação bancária automatizada",
      "Alertas inteligentes de anomalias",
      "Dashboards customizados",
      "Implantação completa e treinamento",
    ],
  },
  assessoria: {
    what: "Jornada de maturidade financeira com acompanhamento especializado. Evolui a empresa por estágios — da fundação financeira básica até a gestão estratégica completa.",
    deliverables: [
      "Diagnóstico estratégico aprofundado",
      "DRE Gerencial e Fluxo de Caixa Realizado",
      "Estruturação de centros de custo",
      "Análise de margem por produto/cliente",
      "Planejamento orçamentário",
      "Acompanhamento mensal personalizado",
    ],
    stages: [
      {
        title: "G1 — Fundação",
        description: "Construir a base: dados confiáveis e primeiros relatórios reais",
        items: [
          "DRE Gerencial Estruturada com visão por unidade de negócio",
          "Fluxo de Caixa Realizado mensal estruturado",
          "Calendário Fiscal Implantado",
        ],
      },
      {
        title: "G2 — Reativa → Controlada",
        description: "Projeção de caixa e controle do ciclo financeiro",
        items: [
          "Fluxo de Caixa Projetado 30–60 dias",
          "DRE Mensal com Análise de Variação",
          "Controle AP/AR + Ciclo Financeiro (PMR/PMP/PME)",
          "Rotina de fechamento mensal até D+5",
        ],
      },
      {
        title: "G3 — Controlada",
        description: "Margem, rentabilidade e ponto de equilíbrio",
        items: [
          "Análise de Capital de Giro (NCG)",
          "PMR, PMP, PME monitorados mensalmente",
          "Ponto de Equilíbrio mensal calculado",
          "Rentabilidade por tipo de produto/serviço e por cliente",
        ],
      },
      {
        title: "G4 — Gerencial",
        description: "Orçamento, KPIs e controle estratégico",
        items: [
          "Orçamento Anual Formalizado com premissas documentadas",
          "Análise orçado vs. realizado (BvA) mensal",
          "Análise de alavancagem operacional (GAO)",
          "Painel de KPIs — Dashboard Gerencial",
        ],
      },
      {
        title: "G5 — Estratégica",
        description: "Modelagem de longo prazo e governança",
        items: [
          "Modelagem Financeira 3–5 anos (3 cenários)",
          "Material pronto para mesa de crédito e investidores",
          "BSC Anual / OKR Trimestral",
          "Governança estratégica implantada",
        ],
      },
    ],
  },
  coordenador: {
    what: "Coordenação operacional do financeiro para promover processos eficientes e execução consistente. É a ponte entre o dia a dia e a estratégia, transformando plano em execução e implementando padrões para que a operação rode com previsibilidade.",
    deliverables: [
      "Diagnóstico de pessoas e processos financeiros",
      "Padronização de rotinas críticas (CP, CR, Conciliação)",
      "Criação de checklists operacionais",
      "Ritual semanal de alinhamento com equipe",
      "Acompanhamento de 2 fechamentos de mês",
      "Relatório de aderência e governança",
      "Indicador de Maturidade Operacional",
    ],
    notIncluded: [
      "Execução contábil/fiscal",
      "Implantação técnica de ERP",
      "Auditoria formal",
    ],
    stages: [
      {
        title: "Diagnóstico de Pessoas e Processos Financeiros",
        description: "Mapeia como os pagamentos, centros de custo e o canal de urgências estão sendo operados, identificando gargalos, riscos e oportunidades de padronização",
        items: [
          "Mapeamento completo dos papéis e responsabilidades do time financeiro",
          "Diagnóstico do processo de contas a pagar e centros de custo por evento",
          "Identificação de riscos operacionais no canal de urgências",
          "Hipóteses de melhorias e quick wins com impacto imediato",
        ],
      },
      {
        title: "Padronização de Rotinas e Criação de Processos",
        description: "Transforma as decisões que hoje dependem do fundador em processos documentados, checklists e políticas que o time executa de forma autônoma e consistente",
        items: [
          "Criação de checklists para abertura, execução e fechamento financeiro de eventos",
          "Padronização do processo de aprovação de pagamentos por alçada",
        ],
      },
      {
        title: "Rituais de Acompanhamento e Indicador de Maturidade Operacional",
        description: "Implanta rituais semanais e mensais que garantem que os processos sejam seguidos com consistência, com medição objetiva da evolução da maturidade operacional",
        items: [
          "Ritual semanal de alinhamento das atividades financeiras",
          "Inspeção por amostragem de lançamentos e documentos",
          "Indicador de Maturidade Operacional com nota quantitativa por processo",
          "Relatório de aderência e recomendações de continuidade",
        ],
      },
    ],
  },
};

function StageCard({ stage, index, badge }: { stage: { title: string; description: string; items: string[] }; index: number; badge?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      "rounded-xl border bg-background/50 overflow-hidden transition-colors",
      open ? "border-primary" : "border-border",
    )}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-primary/5 transition-colors"
      >
        <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{stage.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{stage.description}</p>
        </div>
        {badge && <span className="text-xs text-primary font-medium shrink-0 mr-1">{badge}</span>}
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
          open && "rotate-180",
        )} />
      </button>

      <div className={cn(
        "grid transition-all duration-200 ease-in-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}>
        <div className="overflow-hidden">
          <ul className="px-4 pb-4 pt-1 space-y-1.5 border-t border-border ml-[3.25rem]">
            {stage.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ProductPresentation({ serviceKey, title }: { serviceKey: string; title: string }) {
  const detail = SERVICE_DETAILS[serviceKey];
  if (!detail) return null;

  const hasStages = detail.stages && detail.stages.length > 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="rounded-xl bg-background/50 border border-border p-4 mb-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">O que é — {title}</p>
        <p className="text-sm leading-relaxed">{detail.what}</p>
      </div>

      {hasStages ? (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            {serviceKey === "assessoria"
              ? "Jornada de Maturidade — 5 estágios de evolução"
              : "Escopo — Pilares de entrega"}
          </p>
          <div className="space-y-2">
            {detail.stages!.map((stage, i) => (
              <StageCard
                key={stage.title}
                stage={stage}
                index={i}
                badge={serviceKey === "assessoria" ? "90 dias" : undefined}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Escopo — O que entrega</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {detail.deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.notIncluded && detail.notIncluded.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Não inclui</p>
          <div className="flex flex-wrap gap-2">
            {detail.notIncluded.map((n) => (
              <span key={n} className="text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1">{n}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
