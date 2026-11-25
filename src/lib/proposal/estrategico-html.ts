// Proposta do Diagnóstico Estratégico em HTML autocontido, no mesmo layout das
// propostas do CFO e do Tributário. É um projeto de cobrança única: o valor
// entra no modelo como `setup` (parcelado no cartão) e o serviço fica com
// mensalidade zero, sem âncora CLT nem aviso prévio.

import { SERVICE_DETAILS } from "@/lib/service-scopes";
import { deriveProposal, type ProposalComputed, type ProposalModel } from "./model";
import type { RenderOptions } from "./html";
import { brl, compact, esc, monthYear, nextStepsSection, REVEAL_SCRIPT, STYLES } from "./cfo-html";

/** Boleto/Pix: entrada + 3 parcelas. */
export const ESTRATEGICO_BOLETO_PARCELAS = 4;

const detail = () => SERVICE_DETAILS.estrategico;

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
    `Uma leitura completa da ${name}, área por área, para saber onde o resultado está travado e o que fazer primeiro.`;

  return `<section class="hero">
    <div class="brandline">${o2}<span class="x">×</span>${cli}</div>
    <div class="eyebrow">Proposta · ${esc(m.services[0]?.name ?? "Diagnóstico Estratégico")}</div>
    <h1>Clareza antes da decisão.<span class="accent">Plano antes da ação.</span></h1>
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
  const pains = m.pains ?? [];
  if (revenue <= 0 && pains.length === 0) return "";

  const kpis =
    revenue > 0
      ? `<div class="kpis">
      <div class="kpi"><div class="k">Faturamento</div><div class="v money">${compact(revenue)}<small>/mês</small></div><div class="s">referência informada para a proposta</div></div>
      <div class="kpi"><div class="k">Faturamento anual</div><div class="v money">${compact(revenue * 12)}</div><div class="s">a operação que o diagnóstico vai olhar por inteiro</div></div>
      <div class="kpi"><div class="k">Áreas avaliadas</div><div class="v">${detail().areas?.items.length ?? 10}</div><div class="s">do financeiro ao capital humano</div></div>
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
      ? `Uma operação de <strong>${compact(revenue * 12)} por ano</strong> tem muitas alavancas ao mesmo tempo. Sem um retrato fiel, a energia vai para o problema mais barulhento, não para o que mais pesa no resultado.`
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
  const areas = detail().areas;
  return `<section class="rv">
    <div class="eyebrow">A tese</div>
    <h2>Primeiro o retrato. Depois a decisão.</h2>
    <div class="thesis-words">
      <div class="word"><span>01</span>Enxergar.</div>
      <div class="word"><span>02</span>Priorizar.</div>
      <div class="word"><span>03</span>Agir.</div>
    </div>
    <div class="thesis-note">${esc(detail().what)}</div>
    ${
      areas
        ? `<div class="thesis-note"><strong>${esc(areas.title)}.</strong> ${esc(areas.intro)}</div>
    <ul class="deliv">${areas.items.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`
        : ""
    }
  </section>`;
}

function scopeSection(m: ProposalModel, c: ProposalComputed): string {
  const current = c.closing ?? c.table;
  const closing = c.closing;
  const service = m.services[0];
  const installments = current.installments || 12;
  const boleto = current.setupTotal / ESTRATEGICO_BOLETO_PARCELAS;

  const pillars = (detail().pillars ?? [])
    .map(
      (p, i) => `<div class="pillar">
          <span class="pn">${String(i + 1).padStart(2, "0")}</span>
          <h4>${esc(p.title)}</h4>
          <div class="ps">${esc(p.subtitle)}</div>
          <ul>${p.items.map((it) => `<li>${esc(it.label)}<span>${esc(it.detail)}</span></li>`).join("")}</ul>
        </div>`,
    )
    .join("");

  const projectCard = `<div class="phase-card featured">
      <div class="ph-head">
        <div>
          ${closing ? `<span class="alt-tag">Condição de fechamento</span>` : ""}
          <div class="ph-kicker">Projeto · investimento único</div>
          <div class="ph-title">${esc(service?.name ?? "Diagnóstico Estratégico")}</div>
          <p class="ph-desc">Análise do negócio, diagnóstico de forças e gargalos e um plano de ação com simulação do resultado. A execução das melhorias pode seguir com o time da ${esc(m.client.name)} ou com a O2.</p>
        </div>
        <div class="ph-price">
          <span class="label">Investimento</span>
          ${closing && closing.setupDiscount > 0 ? `<span class="was money">${installments}× ${brl(c.table.setupTotal / installments)}</span>` : ""}
          <span class="val money">${installments}× ${brl(current.setupInstallment)}</span><span class="per">no cartão</span>
          <span class="cond">ou <strong>${ESTRATEGICO_BOLETO_PARCELAS}× de ${brl(boleto)}</strong> no boleto/Pix (entrada + ${ESTRATEGICO_BOLETO_PARCELAS - 1}).</span>
          <span class="cond">Total de <strong>${brl(current.setupTotal)}</strong> pelo projeto completo, sem mensalidade recorrente.</span>
        </div>
      </div>
      <div class="pillars">${pillars}</div>
    </div>`;

  const results = detail().results ?? [];
  const unlock = results.length
    ? `<p class="unlock"><strong>O que destrava:</strong> ${results.map((r) => esc(r.replace(/\.$/, "").toLowerCase())).join("; ")}.</p>`
    : "";

  const saving =
    closing && closing.setupDiscount > 0
      ? ` Na condição de fechamento, a ${esc(m.client.name)} economiza <strong>${brl(closing.setupDiscount)}</strong> em relação ao valor de tabela.`
      : "";

  return `<section class="rv">
    <div class="eyebrow">O escopo e o investimento</div>
    <h2>Do retrato ao plano de ação</h2>
    <p class="lead">Um projeto com começo, meio e fim: um investimento fechado, sem mensalidade recorrente, que termina com prioridades claras e o efeito projetado de cada melhoria.</p>
    ${projectCard}
    ${unlock}
    <p class="inv-foot">Proposta válida por <strong>${c.validityDays} dias</strong> a partir da emissão.${saving}</p>
  </section>`;
}

export function renderEstrategicoProposalHTML(
  model: ProposalModel,
  opts: RenderOptions = {},
): string {
  const c = deriveProposal(model);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(model.client.name)} × O2 · ${esc(model.services[0]?.name ?? "Diagnóstico Estratégico")}</title>
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
  ${nextStepsSection("estrategico")}
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
