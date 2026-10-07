// Proposta do CFO as a Service em HTML autocontido, no formato das propostas
// de turnaround (hero, tese, escopo em frentes, primeiros 30 dias e
// investimento). Não depende de transcrição: o ponto de partida sai dos dados
// da calculadora, e as dores entram só quando o modelo as fornece.
//
// Diferente do renderizador genérico, aqui não há âncora CLT e os valores
// aparecem abertos, sem botão de revelar.

import { SERVICE_DETAILS } from "@/lib/service-scopes";
import { deriveProposal, type ProposalComputed, type ProposalModel } from "./model";
import type { RenderOptions } from "./html";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Faturamento em ordem de grandeza: "R$ 600 mil", "R$ 1,2 mi". */
function compact(value: number): string {
  if (value >= 1e6) {
    const mi = value / 1e6;
    return `R$ ${mi.toLocaleString("pt-BR", { maximumFractionDigits: mi >= 10 ? 0 : 1 })} mi`;
  }
  return `R$ ${Math.round(value / 1e3).toLocaleString("pt-BR")} mil`;
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function monthYear(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MESES[Number(m) - 1]} de ${y}`;
}

const STYLES = `
  :root {
    --bg: #0d0d0d; --card: #151515; --card-2: #191919; --border: #272727;
    --fg: #ffffff; --muted: #a6a6a6; --muted-2: #7a7a7a;
    --primary: #35e07c; --primary-dim: rgba(53, 224, 124, 0.14); --primary-line: rgba(53, 224, 124, 0.4);
    --alert: #fab219; --alert-dim: rgba(250, 178, 25, 0.12); --alert-line: rgba(250, 178, 25, 0.4);
    --radius: 14px;
    --sans: "Inter", -apple-system, "Segoe UI", system-ui, sans-serif;
    --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  }
  @supports (color: oklch(82% 0.24 145)) { :root { --primary: oklch(82% 0.24 145); } }

  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--sans); line-height: 1.6; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
  section { padding: 88px 0; border-top: 1px solid var(--border); }
  section:first-of-type { border-top: none; }

  .eyebrow { display: inline-flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--primary); margin-bottom: 18px; }
  .eyebrow::before { content: ""; width: 18px; height: 1px; background: var(--primary); }
  h1, h2, h3 { line-height: 1.08; text-wrap: balance; margin: 0; }
  h1 { font-size: clamp(36px, 6vw, 74px); font-weight: 800; text-transform: uppercase; letter-spacing: 0.005em; }
  h2 { font-size: clamp(28px, 4vw, 44px); font-weight: 800; text-transform: uppercase; letter-spacing: 0.005em; }
  h3 { font-size: 19px; font-weight: 700; }
  .lead { color: var(--muted); font-size: clamp(16px, 2vw, 19px); max-width: 66ch; margin-top: 18px; }
  .lead strong { color: var(--fg); }
  .money { font-variant-numeric: tabular-nums; }

  .hero { padding: 110px 0 96px; position: relative; overflow: hidden; }
  .hero::after { content: ""; position: absolute; inset: auto -20% -60% -20%; height: 420px; background: radial-gradient(ellipse at center, rgba(53,224,124,0.09), transparent 65%); pointer-events: none; }
  .hero h1 .accent { color: var(--primary); display: block; }
  .hero-sub { color: var(--muted); font-size: clamp(16px, 2.2vw, 20px); max-width: 60ch; margin-top: 24px; }
  .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }
  .chip { font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); border: 1px solid var(--border); border-radius: 999px; padding: 7px 14px; }
  .chip strong { color: var(--fg); font-weight: 600; }
  .brandline { display: flex; align-items: center; gap: 18px; margin-bottom: 34px; flex-wrap: wrap; }
  .brandline .logo-o2 { height: 34px; width: auto; display: block; }
  .brandline .logo-cli { height: 40px; max-width: 180px; width: auto; object-fit: contain; display: block; }
  .brandline .o2-text { font-weight: 800; font-size: 26px; color: var(--primary); }
  .brandline .client { font-weight: 800; font-size: 21px; letter-spacing: 0.06em; text-transform: uppercase; }
  .brandline .x { color: var(--muted-2); font-size: 13px; font-family: var(--mono); }

  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-top: 44px; }
  @media (max-width: 860px) { .grid-2 { grid-template-columns: 1fr; } }
  .pain { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 26px; display: flex; flex-direction: column; gap: 8px; }
  .pain .tag { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary); }
  .pain p { color: var(--muted); font-size: 14.5px; margin: 0; }
  .pain q { color: var(--fg); font-style: italic; }

  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 44px; }
  @media (max-width: 860px) { .kpis { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 520px) { .kpis { grid-template-columns: 1fr; } }
  .kpi { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px 22px 20px; }
  .kpi .k { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .kpi .v { font-size: clamp(26px, 3.2vw, 34px); font-weight: 800; margin-top: 6px; line-height: 1.1; }
  .kpi .v small { font-size: 0.45em; font-weight: 500; color: var(--muted-2); margin-left: 4px; }
  .kpi .s { color: var(--muted-2); font-size: 12.5px; margin-top: 6px; }
  .kpi.good .v { color: var(--primary); }

  .thesis-words { display: flex; flex-wrap: wrap; gap: 12px 28px; margin-top: 40px; align-items: baseline; }
  .thesis-words .word { font-size: clamp(30px, 5vw, 56px); font-weight: 800; text-transform: uppercase; }
  .thesis-words .word span { color: var(--primary); font-family: var(--mono); font-size: 0.45em; vertical-align: super; margin-right: 6px; font-weight: 500; }
  .thesis-note { margin-top: 36px; border: 1px solid var(--primary-line); background: var(--primary-dim); border-radius: var(--radius); padding: 22px 26px; color: rgba(255,255,255,0.92); font-size: 15px; max-width: 78ch; }
  .thesis-note strong { color: var(--primary); }
  .thesis-note + .thesis-note { margin-top: 14px; }

  .phase-card { border: 1px solid var(--border); border-radius: var(--radius); background: var(--card); padding: 34px; margin-top: 26px; }
  .phase-card.featured { border-color: var(--primary-line); background: linear-gradient(180deg, rgba(53,224,124,0.05), var(--card) 40%); }
  .ph-kicker { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--primary); margin-bottom: 10px; }
  .ph-title { font-size: clamp(22px, 3vw, 30px); font-weight: 800; text-transform: uppercase; }
  .ph-desc { color: var(--muted); font-size: 15px; margin-top: 12px; max-width: 72ch; }
  .pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 28px; }
  @media (max-width: 860px) { .pillars { grid-template-columns: 1fr; } }
  .pillar { background: var(--card-2); border: 1px solid var(--border); border-radius: 12px; padding: 22px; }
  .pillar .pn { font-family: var(--mono); font-size: 11px; color: var(--primary); letter-spacing: 0.12em; }
  .pillar h4 { margin: 6px 0 2px; font-size: 17px; font-weight: 800; text-transform: uppercase; }
  .pillar .ps { color: var(--muted-2); font-size: 12.5px; margin-bottom: 14px; }
  .pillar ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .pillar li { font-size: 13px; color: rgba(255,255,255,0.88); padding-left: 20px; position: relative; }
  .pillar li::before { content: "✓"; position: absolute; left: 0; color: var(--primary); font-size: 12px; }
  .pillar li span { display: block; color: var(--muted-2); font-size: 12px; }
  .team { display: grid; grid-template-columns: repeat(3, 1fr) 1.3fr; gap: 14px; margin-top: 14px; }
  @media (max-width: 860px) { .team { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 520px) { .team { grid-template-columns: 1fr; } }
  .tm { border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; }
  .tm .r { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary); }
  .tm b { display: block; font-size: 14px; margin-top: 4px; }
  .tm span { color: var(--muted-2); font-size: 12px; }
  .unlock { margin-top: 24px; border-left: 2px solid var(--primary); padding: 4px 0 4px 16px; font-size: 14px; color: var(--muted); max-width: 80ch; }
  .unlock strong { color: var(--fg); }

  .steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 40px; }
  @media (max-width: 860px) { .steps { grid-template-columns: 1fr; } }
  .step { background: var(--card-2); border: 1px solid var(--border); border-radius: 12px; padding: 18px; position: relative; }
  .step::after { content: ""; position: absolute; top: 0; left: 16px; width: 26px; height: 2px; background: var(--primary); border-radius: 2px; }
  .step .lb { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--primary); margin: 8px 0 4px; }
  .step .tt { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
  .step ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .step li { font-size: 11.5px; color: var(--muted); }

  .price-card { margin-top: 44px; border: 1px solid var(--primary-line); border-radius: var(--radius); background: linear-gradient(180deg, rgba(53,224,124,0.07), var(--card) 60%); padding: 38px; display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: center; }
  @media (max-width: 860px) { .price-card { grid-template-columns: 1fr; padding: 28px; } }
  .price-card .what .k { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--primary); }
  .price-card .what h3 { font-size: clamp(22px, 3vw, 30px); font-weight: 800; text-transform: uppercase; margin-top: 8px; }
  .price-card .what p { color: var(--muted); font-size: 14.5px; margin: 10px 0 0; }
  .ph-price .label { display: block; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
  .ph-price .was { display: block; color: var(--muted-2); font-size: 16px; text-decoration: line-through; margin-bottom: 2px; }
  .ph-price .val { font-size: clamp(38px, 5.4vw, 60px); font-weight: 800; color: var(--primary); line-height: 1.05; }
  .ph-price .per { color: var(--muted-2); font-size: 15px; margin-left: 6px; font-weight: 500; }
  .ph-price .cond { display: block; color: var(--muted); font-size: 13px; margin-top: 10px; }
  .ph-price .cond strong { color: var(--fg); }
  .price-card.alt { margin-top: 18px; border-color: var(--border); background: var(--card); align-items: start; }
  .price-card.alt .ph-price .val { font-size: clamp(32px, 4.4vw, 48px); }
  .alt-tag { display: inline-flex; font-family: var(--mono); font-size: 10.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #0d0d0d; background: var(--primary); border-radius: 999px; padding: 6px 13px; margin-bottom: 14px; }
  .deliv { list-style: none; padding: 0; margin: 16px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
  .deliv li { font-size: 13.5px; color: rgba(255,255,255,0.9); padding-left: 20px; position: relative; }
  .deliv li::before { content: "✓"; position: absolute; left: 0; color: var(--primary); font-size: 12px; }
  @media (max-width: 520px) { .deliv { grid-template-columns: 1fr; } }
  .bridge-title { margin-top: 44px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .bridge { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 18px; }
  @media (max-width: 860px) { .bridge { grid-template-columns: 1fr; } }
  .br { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
  .br .v { font-size: 22px; font-weight: 800; color: var(--primary); }
  .br .v small { font-size: 0.55em; color: var(--muted-2); font-weight: 500; }
  .br .d { color: var(--muted); font-size: 12.5px; margin-top: 4px; }
  .inv-foot { color: var(--muted-2); font-size: 12.5px; margin-top: 18px; max-width: 84ch; }
  .inv-foot strong { color: var(--fg); }

  .next { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 44px; }
  @media (max-width: 860px) { .next { grid-template-columns: 1fr; } }
  .nx { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 26px; }
  .nx .when { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary); }
  .nx h3 { margin-top: 8px; font-size: 16.5px; }
  .nx p { color: var(--muted); font-size: 13.5px; margin: 8px 0 0; }
  .urgent { margin-top: 18px; border: 1px solid var(--alert-line); background: var(--alert-dim); border-radius: var(--radius); padding: 20px 24px; font-size: 14.5px; color: rgba(255,255,255,0.9); }
  .urgent strong { color: var(--alert); }

  footer { border-top: 1px solid var(--border); padding: 48px 0 72px; color: var(--muted-2); font-size: 13px; }
  footer .sig { color: var(--fg); font-weight: 600; font-size: 15px; }
  footer .row { display: flex; flex-wrap: wrap; gap: 8px 28px; margin-top: 6px; }

  .rv { opacity: 0; transform: translateY(14px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .rv.in { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .rv { opacity: 1; transform: none; transition: none; }
  }

  @media print {
    @page { margin: 0; }
    html, body { margin: 0; background: var(--bg); }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .rv { opacity: 1 !important; transform: none !important; transition: none; }
    section { padding: 48px 0; break-inside: avoid-page; }
    .hero { padding: 60px 0 48px; }
    .grid-2, .price-card { grid-template-columns: 1fr 1fr !important; }
    .pillars, .kpis, .next { grid-template-columns: repeat(3, 1fr) !important; }
    .bridge { grid-template-columns: 1fr 1fr !important; }
    .steps { grid-template-columns: repeat(5, 1fr) !important; }
    .team { grid-template-columns: repeat(4, 1fr) !important; }
    .wrap { padding: 0 32px; }
  }
`;

const REVEAL_SCRIPT = `
  const rows = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }
    }, { threshold: 0.08 });
    rows.forEach((r) => io.observe(r));
  } else {
    rows.forEach((r) => r.classList.add('in'));
  }
`;

const FIRST_30_DAYS = [
  {
    label: "Kickoff",
    title: "Alinhamento",
    items: [
      "Responsáveis e rituais definidos",
      "Acessos ao ERP e aos bancos",
      "Contador no circuito",
      "Canais de comunicação",
    ],
  },
  {
    label: "Semana 1",
    title: "Levantamento",
    items: [
      "Estudo da empresa e do ERP",
      "Extratos e contratos de dívida",
      "Relatórios do contador",
      "Pré-análise do plano de contas",
    ],
  },
  {
    label: "Semana 2",
    title: "Mapeamento",
    items: [
      "Faturamento e recebimento",
      "Compras, pagamento e conciliação",
      "Custeio",
      "Correções apontadas por processo",
    ],
  },
  {
    label: "Semana 3",
    title: "Caixa e estrutura",
    items: [
      "Fluxo de caixa projetado",
      "Mapa do endividamento",
      "Ciclo financeiro e capital de giro",
      "Integração do ERP com a Oxy iniciada",
    ],
  },
  {
    label: "Semana 4",
    title: "Primeiro comitê",
    items: [
      "Leitura inicial dos números",
      "Prioridades dos 90 dias",
      "Cronograma da Oxy validado",
      "Agenda de rituais fixada",
    ],
  },
];

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
    `Um diretor financeiro sênior dentro da rotina da ${name}: estrutura o dado na origem, entrega os relatórios que faltam e conduz a decisão toda semana, com a Oxy e o Gênio trabalhando por trás.`;

  return `<section class="hero">
    <div class="brandline">${o2}<span class="x">×</span>${cli}</div>
    <div class="eyebrow">Proposta · CFO as a Service</div>
    <h1>Decisão com número.<span class="accent">Caixa com direção.</span></h1>
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
      <div class="kpi"><div class="k">Faturamento anual</div><div class="v money">${compact(revenue * 12)}</div><div class="s">estimado a partir do mês</div></div>
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
      ? `Uma operação de <strong>${compact(revenue * 12)} por ano</strong> não pode decidir no escuro. Cada ponto de margem e cada dia de caixa preso viram dinheiro de verdade nessa escala, e é por isso que a direção financeira precisa ter número na mesa toda semana.`
      : "O que ouvimos na conversa, e o que o escopo responde.";

  return `<section class="rv">
    <div class="eyebrow">O ponto de partida</div>
    <h2>O tamanho do que está em jogo</h2>
    <p class="lead">${lead}</p>
    ${kpis}
    ${painCards}
  </section>`;
}

function thesisSection(m: ProposalModel): string {
  const name = esc(m.client.name);
  return `<section class="rv">
    <div class="eyebrow">A tese</div>
    <h2>Faturamento é métrica de ego. Caixa é métrica de sobrevivência.</h2>
    <div class="thesis-words">
      <div class="word"><span>01</span>Estruturar.</div>
      <div class="word"><span>02</span>Enxergar.</div>
      <div class="word"><span>03</span>Decidir.</div>
      <div class="word"><span>04</span>Crescer.</div>
    </div>
    <div class="thesis-note">Primeiro <strong>estruturar</strong>: plano de contas revisado e o dado do ERP conectado à Oxy, porque sem dado confiável toda decisão vira palpite. Depois <strong>enxergar</strong>: DRE gerencial, fluxo de caixa projetado e ciclo financeiro mostrando onde a empresa ganha, onde perde e onde o caixa fica preso. Com o número na mesa, <strong>decidir</strong> toda semana, com prioridade, dono e prazo. E só então <strong>crescer</strong>, com margem e caixa para sustentar o crescimento.</div>
    <div class="thesis-note">Por que um CFO as a Service, e não mais um relatório? Porque o relatório mostra o problema, mas não decide. A ${name} passa a ter um diretor financeiro sênior na rotina, com a disciplina de quem já conduziu empresas sob pressão de caixa, sem o custo e o tempo de contratar um em tempo integral.</div>
  </section>`;
}

function scopeSection(m: ProposalModel): string {
  const detail = SERVICE_DETAILS.cfo;
  const pillars = (detail.pillars ?? [])
    .map(
      (p, i) => `<div class="pillar">
          <span class="pn">${String(i + 1).padStart(2, "0")}</span>
          <h4>${esc(p.title)}</h4>
          <div class="ps">${esc(p.subtitle)}</div>
          <ul>${p.items.map((it) => `<li>${esc(it.label)}<span>${esc(it.detail)}</span></li>`).join("")}</ul>
        </div>`,
    )
    .join("");

  return `<section class="rv">
    <div class="eyebrow">O escopo</div>
    <h2>Três frentes que conversam entre si</h2>
    <p class="lead">Não adianta ter relatório sem condução: o número fica bonito e nada muda. Nem conduzir sem número confiável: a decisão vira opinião. As três frentes rodam no mesmo plano e na mesma mesa, desde o primeiro mês.</p>

    <div class="phase-card featured">
      <div class="ph-kicker">Recorrência mensal · CFO sênior dedicado</div>
      <div class="ph-title">CFO as a Service</div>
      <p class="ph-desc">A O2 senta ao lado da diretoria da ${esc(m.client.name)} para conduzir a gestão financeira: define direção, prioridades, metas e indicadores, entrega os relatórios que a empresa não tem e transforma a análise em dinheiro no caixa.</p>
      <div class="pillars">${pillars}</div>
    </div>

    <div class="team">
      <div class="tm"><div class="r">CFO</div><b>Condução e decisão</b><span>diretor financeiro sênior na rotina</span></div>
      <div class="tm"><div class="r">Oxy</div><b>Dados em um só lugar</b><span>ERP conectado e painéis gerenciais</span></div>
      <div class="tm"><div class="r">Gênio</div><b>Agente de IA</b><span>automação e alertas do que sai do normal</span></div>
      <div class="tm"><div class="r">Rituais</div><b>Ritmo de gestão</b><span>disponibilidade diária, reunião semanal, comitê estratégico mensal e registro de toda reunião</span></div>
    </div>
    <p class="unlock"><strong>O que destrava:</strong> um número em que a diretoria acredita, um fluxo de caixa que avisa o aperto antes de apertar, uma dívida com custo conhecido e um ritmo de decisão que não depende de urgência para acontecer.</p>
  </section>`;
}

function first30Section(): string {
  const steps = FIRST_30_DAYS.map(
    (s) => `<div class="step">
        <div class="lb">${s.label}</div>
        <div class="tt">${s.title}</div>
        <ul>${s.items.map((i) => `<li>${i}</li>`).join("")}</ul>
      </div>`,
  ).join("");
  return `<section class="rv">
    <div class="eyebrow">Os primeiros 30 dias</div>
    <h2>Como o trabalho começa</h2>
    <p class="lead">O primeiro mês organiza a origem e coloca o primeiro número na mesa: onde a empresa ganha, onde o caixa está preso e quais decisões vêm primeiro. Ele termina com o primeiro comitê e as prioridades dos 90 dias aprovadas.</p>
    <div class="steps">${steps}</div>
  </section>`;
}

function investmentSection(m: ProposalModel, c: ProposalComputed): string {
  const current = c.closing ?? c.table;
  const closing = c.closing;
  const setup = m.setup;
  const hasSetup = Boolean(setup && current.setupTotal > 0 && current.installments > 0);

  const monthlyCard = `<div class="price-card">
      <div class="what">
        ${closing ? `<span class="alt-tag">Condição de fechamento</span>` : ""}
        <div class="k">CFO as a Service · mensal</div>
        <h3>Condução, clareza e resultado no caixa</h3>
        <p>As três frentes, os rituais de acompanhamento e a Oxy com o Gênio, com o CFO responsável pela direção financeira da ${esc(m.client.name)}.</p>
      </div>
      <div class="ph-price">
        <span class="label">Investimento mensal</span>
        ${closing && closing.monthlyDiscount > 0 ? `<span class="was money">${brl(c.table.monthly)}</span>` : ""}
        <span class="val money">${brl(current.monthly)}</span><span class="per">/mês</span>
        <span class="cond">Recorrência mensal, com aviso prévio de ${c.noticeDays} dias para encerramento.</span>
      </div>
    </div>`;

  const deliverables = setup?.deliverables ?? [];
  const setupCard = hasSetup
    ? `<div class="price-card alt">
      <div class="what">
        <span class="alt-tag">Incluído no desembolso mensal</span>
        <div class="k">Setup + Oxy + Gênio · ${current.installments}× no cartão</div>
        <h3>${esc(setup?.label ?? "Estruturação financeira")}</h3>
        <p>A fundação do trabalho: dado confiável na origem, ERP integrado à Oxy e o Gênio operando no seu time.</p>
        ${deliverables.length ? `<ul class="deliv">${deliverables.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="ph-price">
        <span class="label">Investimento</span>
        ${closing && closing.setupDiscount > 0 ? `<span class="was money">${current.installments}× ${brl(c.table.setupTotal / current.installments)}</span>` : ""}
        <span class="val money">${current.installments}× ${brl(current.setupInstallment)}</span><span class="per">no cartão</span>
        <span class="cond">Total de <strong>${brl(current.setupTotal)}</strong>, diluído nas ${current.installments} primeiras mensalidades.</span>
      </div>
    </div>`
    : "";

  const bridge = hasSetup
    ? `<div class="bridge-title">O desembolso, mês a mês</div>
    <div class="bridge">
      <div class="br"><div class="v money">${brl(current.firstYearMonthly)} <small>/mês</small></div><div class="d">nos ${current.installments} primeiros meses: mensalidade + setup</div></div>
      <div class="br"><div class="v money">${brl(current.recurringAfter)} <small>/mês</small></div><div class="d">a partir do mês ${current.installments + 1}, com o setup quitado</div></div>
    </div>`
    : "";

  const saving =
    closing && closing.firstYearSaving > 0
      ? ` Na condição de fechamento, a ${esc(m.client.name)} economiza <strong>${brl(closing.firstYearSaving)}</strong> nos ${current.installments || 12} primeiros meses em relação aos valores de tabela.`
      : "";

  return `<section class="rv">
    <div class="eyebrow">Investimento</div>
    <h2>Um diretor financeiro sênior, sem o custo de um</h2>
    <p class="lead">O CFO as a Service é uma recorrência mensal. A estruturação inicial, com a Oxy e o Gênio, entra diluída no cartão, para o trabalho começar sem um desembolso de implantação à parte.</p>
    ${monthlyCard}
    ${setupCard}
    ${bridge}
    <p class="inv-foot">Proposta válida por <strong>${c.validityDays} dias</strong> a partir da emissão. Contrato com aviso prévio de ${c.noticeDays} dias para encerramento.${saving}</p>
  </section>`;
}

function nextStepsSection(): string {
  const detail = SERVICE_DETAILS.cfo;
  const steps = (detail.nextSteps ?? [])
    .map(
      (s, i) => `<div class="nx">
        <div class="when">Etapa ${String(i + 1).padStart(2, "0")}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
      </div>`,
    )
    .join("");
  const cta = detail.cta
    ? `<div class="urgent"><strong>${esc(detail.cta.title)}.</strong> ${esc(detail.cta.text)}</div>`
    : "";
  return `<section class="rv">
    <div class="eyebrow">Próximos passos</div>
    <h2>O caminho até o kickoff</h2>
    <div class="next">${steps}</div>
    ${cta}
  </section>`;
}

export function renderCFOProposalHTML(model: ProposalModel, opts: RenderOptions = {}): string {
  const c = deriveProposal(model);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(model.client.name)} × O2 · CFO as a Service</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
  ${heroSection(model, c, opts)}
  ${startSection(model)}
  ${thesisSection(model)}
  ${scopeSection(model)}
  ${first30Section()}
  ${investmentSection(model, c)}
  ${nextStepsSection()}
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
