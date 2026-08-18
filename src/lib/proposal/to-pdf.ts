// Ponte entre o ProposalModel e o gerador de PDF já existente (jsPDF).
//
// O PDF continua sendo o material técnico do executivo — tabela de variáveis e
// escopo detalhado. O HTML é o material de apresentação para o cliente. Ambos
// nascem do mesmo modelo, então nunca divergem em valor.

import { formatBRL } from "@/lib/format";
import type { CalcPDFInput } from "@/lib/pdf-export";
import { deriveProposal, scopeText, type ProposalModel } from "./model";

export interface ToPdfOptions {
  /** Linhas de memória de cálculo específicas da calculadora. */
  extraRows?: Array<[string, string]>;
  scopeIntro?: string;
  stages?: CalcPDFInput["stages"];
  stagesTitle?: string;
  roi?: CalcPDFInput["roi"];
}

export function toCalcPDFInput(model: ProposalModel, opts: ToPdfOptions = {}): CalcPDFInput {
  const c = deriveProposal(model);
  const active = c.closing ?? c.table;

  const rows: Array<[string, string]> = [
    ...(opts.extraRows ?? []),
    ...model.services.map(
      (s) => [`${s.name} — mensalidade`, formatBRL(s.monthly)] as [string, string],
    ),
  ];

  if (c.table.setupTotal > 0 && model.setup) {
    rows.push([`${model.setup.label} (total)`, formatBRL(c.table.setupTotal)]);
  }

  if (c.closing && model.setup && c.closing.setupTotal !== c.table.setupTotal) {
    rows.push([`${model.setup.label} — condição de fechamento`, formatBRL(c.closing.setupTotal)]);
  }

  if (c.closing) {
    rows.push(["Mensalidade — condição de fechamento", formatBRL(c.closing.monthly)]);
  }

  if (active.setupInstallment > 0) {
    rows.push([`Setup (${active.installments}x no cartão)`, formatBRL(active.setupInstallment)]);
  }

  if (c.clt) {
    rows.push(["Estrutura CLT equivalente", `${formatBRL(c.clt.monthly)}/mês`]);
  }

  return {
    service: model.services.map((s) => s.name).join(" + "),
    clientName: model.client.name,
    monthlyRevenue: model.client.monthlyRevenue,
    rows,
    finalLabel: active.setupInstallment > 0 ? "Investimento mensal total" : "Mensalidade",
    finalValue: formatBRL(active.firstYearMonthly),
    scope: model.services.flatMap((s) => s.scope.map(scopeText)),
    scopeIntro: opts.scopeIntro,
    notIncluded: model.services.flatMap((s) => s.notIncluded ?? []),
    stages: opts.stages,
    stagesTitle: opts.stagesTitle,
    roi: opts.roi,
  };
}
