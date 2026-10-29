// Proposta do Diagnóstico Tributário em HTML autocontido, no mesmo layout da
// proposta do CFO. É um projeto de 6 meses pago em parcelas no cartão, não uma
// mensalidade: o valor entra no modelo como `setup` e os serviços ficam com
// mensalidade zero, sem âncora CLT nem aviso prévio.

import { SERVICE_DETAILS, type ScopePillar } from "@/lib/service-scopes";
import { deriveProposal, type ProposalComputed, type ProposalModel } from "./model";
import type { RenderOptions } from "./html";
import { brl, compact, esc, monthYear, nextStepsSection, REVEAL_SCRIPT, STYLES } from "./cfo-html";

/** Chave do serviço quando a modalidade contratada é só o diagnóstico. */
export const TRIBUTARIO_DIAGNOSTICO_KEY = "tributario-diagnostico";

const PROJECT_MONTHS = 6;

function isDiagnosticOnly(m: ProposalModel): boolean {
  return m.services[0]?.key === TRIBUTARIO_DIAGNOSTICO_KEY;
}

function pillarsFor(m: ProposalModel): ScopePillar[] {
  const pillars = SERVICE_DETAILS.tributario.pillars ?? [];
  if (!isDiagnosticOnly(m)) return pillars;
  const report = pillars.flatMap((p) => p.items).filter((it) => it.label === "Relatório final");
  return [
    pillars[0],
    { title: "Recomendações", subtitle: "O que fazer, e em que ordem.", items: report },
  ];
}

function heroSection(m: ProposalModel, c: ProposalComputed, opts: RenderOptions): string {
  const name = esc(m.client.name);
  const o2 = opts.logoO2DataUrl
    ? `<img class="logo-o2" src="${opts.logoO2DataUrl}" alt="O2 Inc">`
    : `<span class="o2-text">O2</span>`;
  const cli = m.client.logoDataUrl
    ? `<img class="logo-cli" src="${m.client.logoDataUrl}" alt="${name}">`
    : `<span class="client">${name}</span>`;
  const sub =
    m.subheadline ??
    `A Reforma Tributária muda o cálculo do preço, a margem e o momento em que o imposto sai do caixa. Este projeto mostra quanto ela pesa na ${name} e deixa a empresa pronta para a virada.`;

  return `<section class="hero">
    <div class="brandline">${o2}<span class="x">×</span>${cli}</div>
    <div class="eyebrow">Proposta · ${esc(m.services[0]?.name ?? "Diagnóstico Tributário")}</div>
    <h1>Reforma tributária.<span class="accent">Margem protegida.</span></h1>
    <p class="hero-sub">${sub}</p>
    <div class="chips">
      <div class="chip">Preparado para <strong>${name}</strong></div>
      <div class="chip">Por <strong>O2 Inc</strong></div>
      <div class="chip">${monthYear(c.date)}</div>
      <div class="chip">Confidencial</div>
    </div>
  </section>`;
}

function startSection(m: ProposalModel): string {
  const revenue = m.client.monthlyRevenue ?? 0;
  const cnpjs = m.client.cnpjCount ?? 1;
  const pains = m.pains ?? [];
  if (revenue <= 0 && pains.length === 0) return "";

  const kpis =
    revenue > 0
      ? `<div class="kpis">
      <div class="kpi"><div class="k">Faturamento</div><div class="v money">${compact(revenue)}<small>/mês</small></div><div class="s">referência informada para a proposta</div></div>
      <div class="kpi"><div class="k">Faturamento anual</div><div class="v money">${compact(revenue * 12)}</div><div class="s">base sobre a qual a CBS e o IBS vão incidir</div></div>
      <div class="kpi"><div class="k">Estrutura</div><div class="v">${cnpjs > 1 ? `${cnpjs} CNPJs` : "CNPJ único"}</div><div class="s">${
        cnpjs > 1 ? "empresas dentro do mesmo escopo" : "uma empresa no escopo"
      }</div></div>
    </div>`
      : "";

  const painCards = pains.length
    ? `<div class="grid-2">${pains
        .map(
          (p) => `<div class="pain">
        <span class="tag">${esc(p.title)}</span>
        <p>${esc(p.description)}</p>
        ${p.quote ? `<p><q>${esc(p.quote)}</q></p>` : ""}
      </div>`,
        )
        .join("")}</div>`
    : "";

  const lead =
    revenue > 0
      ? `Sobre <strong>${compact(revenue * 12)} por ano</strong> de faturamento, cada ponto de diferença na carga tributária vira dinheiro de verdade. Quem mede o impacto antes ajusta preço e contrato com calma; quem espera descobre o efeito direto no caixa.`
      : "O que ouvimos na conversa, e o que o escopo responde.";

  return `<section class="rv">
    <div class="eyebrow">O ponto de partida</div>
    <h2>O tamanho do que está em jogo</h2>
    <p class="lead">${lead}</p>
    ${kpis}
    ${painCards}
  </section>`;
}

function thesisSection(): string {
  const context = SERVICE_DETAILS.tributario.notes?.[0]?.text ?? "";
  return `<section class="rv">
    <div class="eyebrow">A tese</div>
    <h2>Imposto novo não se paga com preço antigo.</h2>
    <div class="thesis-words">
      <div class="word"><span>01</span>Medir.</div>
      <div class="word"><span>02</span>Ajustar.</div>
      <div class="word"><span>03</span>Transicionar.</div>
    </div>
    ${context ? `<div class="thesis-note">${esc(context)}</div>` : ""}
    <div class="thesis-note">Primeiro <strong>medir</strong>: o cenário atual comparado com a CBS e o IBS, produto a produto, e o efeito do split payment no fluxo de caixa. Depois <strong>ajustar</strong>: cadastro fiscal, contratos e preço alinhados ao novo modelo. E então <strong>transicionar</strong> com um plano claro até 2027 e a equipe preparada para operar.</div>
  </section>`;
}

function scopeSection(m: ProposalModel, c: ProposalComputed): string {
  const current = c.closing ?? c.table;
  const closing = c.closing;
  const service = m.services[0];
  const installments = current.installments || 12;

  const pillars = pillarsFor(m)
    .map(
      (p, i) => `<div class="pillar">
          <span class="pn">${String(i + 1).padStart(2, "0")}</span>
          <h4>${esc(p.title)}</h4>
          <div class="ps">${esc(p.subtitle)}</div>
          <ul>${p.items.map((it) => `<li>${esc(it.label)}<span>${esc(it.detail)}</span></li>`).join("")}</ul>
        </div>`,
    )
    .join("");

  const desc = isDiagnosticOnly(m)
    ? `O raio-x do impacto da reforma na ${esc(m.client.name)}, com relatório de recomendações. A execução das adequações fica com o time da empresa.`
    : `Do diagnóstico do impacto à empresa pronta para operar no novo modelo: cadastros, contratos e preço adequados, plano de transição e equipe capacitada.`;

  const projectCard = `<div class="phase-card featured">
      <div class="ph-head">
        <div>
          ${closing ? `<span class="alt-tag">Condição de fechamento</span>` : ""}
          <div class="ph-kicker">Projeto de ${PROJECT_MONTHS} meses · especialista tributário</div>
          <div class="ph-title">${esc(service?.name ?? "Diagnóstico Tributário")}</div>
          <p class="ph-desc">${desc}</p>
        </div>
        <div class="ph-price">
          <span class="label">Investimento</span>
          ${closing && closing.setupDiscount > 0 ? `<span class="was money">${installments}× ${brl(c.table.setupTotal / installments)}</span>` : ""}
          <span class="val money">${installments}× ${brl(current.setupInstallment)}</span><span class="per">no cartão</span>
          <span class="cond">Total de <strong>${brl(current.setupTotal)}</strong> pelo projeto completo, parcelado em ${installments} vezes no cartão de crédito.</span>
        </div>
      </div>
      <div class="pillars">${pillars}</div>
    </div>`;

  const saving =
    closing && closing.setupDiscount > 0
      ? ` Na condição de fechamento, a ${esc(m.client.name)} economiza <strong>${brl(closing.setupDiscount)}</strong> em relação ao valor de tabela.`
      : "";

  return `<section class="rv">
    <div class="eyebrow">O escopo e o investimento</div>
    <h2>${isDiagnosticOnly(m) ? "O raio-x da reforma na sua empresa" : "Do impacto ao plano de transição"}</h2>
    <p class="lead">Um projeto com começo, meio e fim: ${PROJECT_MONTHS} meses de trabalho e um investimento fechado, sem mensalidade recorrente.</p>
    ${projectCard}
    <p class="inv-foot">Proposta válida por <strong>${c.validityDays} dias</strong> a partir da emissão.${saving}</p>
  </section>`;
}

export function renderTributarioProposalHTML(
  model: ProposalModel,
  opts: RenderOptions = {},
): string {
  const c = deriveProposal(model);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(model.client.name)} × O2 · ${esc(model.services[0]?.name ?? "Diagnóstico Tributário")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
  ${heroSection(model, c, opts)}
  ${startSection(model)}
  ${thesisSection()}
  ${scopeSection(model, c)}
  ${nextStepsSection("tributario")}
  <footer>
    <div class="sig">O2 Inc · Compreender pessoas, oxigenar negócios.</div>
    <div class="row">
      <span>Documento preparado para ${esc(model.client.name)}</span>
      <span>Time com trajetória em EY, Falconi, Gerdau e Ambev</span>
      <span>Matriz em Porto Alegre · Operação em conformidade com a LGPD</span>
    </div>
  </footer>
</div>
<script>${REVEAL_SCRIPT}</script>
</body>
</html>`;
}
