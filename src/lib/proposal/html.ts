// Renderiza a proposta em HTML autocontido — um único arquivo, sem
// dependência externa além da fonte, que pode ser enviado ao cliente e aberto
// em qualquer navegador (ou impresso em PDF pelo próprio browser).
//
// Seções condicionais: dores, âncora CLT, condição de fechamento e o argumento
// de bundle aparecem só quando o modelo os fornece.

import { formatBRL } from "@/lib/format";
import {
  deriveProposal,
  shortServiceName,
  type ProposalComputed,
  type ProposalModel,
  type ScopeItem,
} from "./model";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Valor inteiro truncado — mantém a soma das linhas exibidas coerente. */
function money(value: number): string {
  return `R$ ${Math.trunc(value).toLocaleString("pt-BR")}`;
}

/** Bullet do escopo: rótulo em destaque quando o item é agrupado. */
function scopeLi(item: ScopeItem): string {
  if (typeof item === "string") return `<li>${esc(item)}</li>`;
  return `<li><b>${esc(item.label)}:</b> ${esc(item.text)}</li>`;
}

function pctStr(value: number, digits = 0): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

function dateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${y}`;
}

const STYLES = `
  :root{
    --bg:#0A0A0A; --card:#111111; --card-2:#161616;
    --border:#1E1E1E; --border-2:#2A2A2A;
    --fg:#FFFFFF; --muted:#A0A0A0; --muted-2:#6E6E6E;
    --green:#00E85F; --green-line:rgba(0,232,95,.28);
    --red:#EF4444; --amber:#EAB308;
    --r-md:8px; --r-lg:12px; --r-xl:16px; --r-2xl:20px;
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{
    margin:0;background:var(--bg);color:var(--fg);
    font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    font-size:16px;line-height:1.6;font-weight:400;-webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:1080px;margin:0 auto;padding:0 32px}
  section{padding:88px 0;border-top:1px solid var(--border)}
  section:first-of-type{border-top:none}
  .eyebrow{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green);margin:0 0 16px}
  .eyebrow.neutral{color:var(--muted-2)}
  h1{font-size:clamp(34px,5vw,56px);line-height:1.05;font-weight:700;letter-spacing:-.03em;margin:0 0 20px}
  h2{font-size:clamp(26px,3.4vw,38px);line-height:1.12;font-weight:700;letter-spacing:-.02em;margin:0 0 16px}
  h3{font-size:19px;font-weight:600;letter-spacing:-.01em;margin:0 0 8px}
  p{margin:0 0 16px;color:var(--muted)}
  p.lead{font-size:18px;line-height:1.6;max-width:72ch}
  strong{color:var(--fg);font-weight:600}
  .num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
  .cover{padding:64px 0 88px}
  .logos{display:flex;align-items:center;gap:28px;margin-bottom:72px;flex-wrap:wrap}
  .logos img.o2{height:34px;width:auto}
  .logos img.cli{height:44px;width:auto;opacity:.95}
  .logos .o2-text{font-size:30px;font-weight:800;letter-spacing:-.02em;color:var(--green)}
  .logos .cli-text{font-size:20px;font-weight:600;color:var(--fg)}
  .logos .x{color:var(--border-2);font-size:22px;font-weight:300}
  .cover h1{max-width:30ch}
  .cover .sub{font-size:19px;color:var(--muted);max-width:66ch;margin-bottom:44px}
  .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
  .fact{background:var(--card);padding:20px 22px}
  .fact .k{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted-2);font-weight:600;margin-bottom:6px}
  .fact .v{font-size:15px;font-weight:600;color:var(--fg);line-height:1.35}
  .fact .v span{display:block;color:var(--muted-2);font-size:12.5px;font-weight:400;margin-top:3px}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .pain{background:var(--card);border:1px solid var(--border);border-left:2px solid var(--border-2);border-radius:var(--r-md);padding:22px 24px}
  .pain .n{font-size:11px;font-weight:700;color:var(--muted-2);letter-spacing:.1em;margin-bottom:10px}
  .pain h3{font-size:16px;margin-bottom:8px}
  .pain p{font-size:14px;margin:0}
  .quote{margin-top:14px;padding-left:12px;border-left:2px solid var(--green-line);font-size:13px;color:var(--muted-2);font-style:italic}
  .anchor-box{border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden}
  .anchor-row{display:grid;grid-template-columns:1fr auto auto;gap:24px;align-items:center;padding:22px 26px;background:var(--card);border-bottom:1px solid var(--border)}
  .anchor-row:last-child{border-bottom:none}
  .anchor-row .role{font-size:15px;font-weight:600}
  .anchor-row .role span{display:block;font-size:12.5px;font-weight:400;color:var(--muted-2);margin-top:3px}
  .anchor-row .base{font-size:13px;color:var(--muted);text-align:right;white-space:nowrap}
  .anchor-row .base em{font-style:normal;color:var(--muted-2)}
  .anchor-row .cost{font-size:20px;font-weight:700;text-align:right;white-space:nowrap;min-width:150px}
  .anchor-row .cost small{font-size:12px;font-weight:400;color:var(--muted-2)}
  .anchor-row.total{background:var(--card-2)}
  .anchor-row.total .cost{font-size:26px}
  .note{font-size:12.5px;color:var(--muted-2);margin-top:14px;line-height:1.55}
  .scen{background:var(--card);border:1px solid var(--border);border-radius:var(--r-xl);padding:30px;display:flex;flex-direction:column}
  .scen .tag{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--muted-2);margin-bottom:18px}
  .scen h3{font-size:22px;letter-spacing:-.02em;margin-bottom:6px}
  .scen .role{font-size:13.5px;color:var(--muted);margin-bottom:24px;min-height:42px}
  .price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
  .price .v{font-size:clamp(30px,3.4vw,38px);font-weight:700;letter-spacing:-.03em;line-height:1;white-space:nowrap}
  .price .per{font-size:13px;color:var(--muted-2);font-weight:500}
  .scope{list-style:none;margin:22px 0 0;padding:20px 0 0;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:10px}
  .scope li{position:relative;padding-left:22px;font-size:13.5px;color:var(--muted);line-height:1.5}
  .scope li::before{content:"";position:absolute;left:0;top:7px;width:6px;height:6px;border-radius:50%;background:var(--green);opacity:.75}
  .scope li b{color:var(--fg);font-weight:600}
  .sum{margin-top:20px;background:var(--card-2);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden}
  .sum-head{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;padding:26px 30px}
  .sum-head .lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--muted-2);margin-bottom:8px}
  .sum-head h3{font-size:20px;margin:0}
  .sum-head p{font-size:13.5px;margin:6px 0 0;max-width:62ch}
  .sum-head .val{text-align:right}
  .sum-head .val .big{font-size:clamp(28px,3.2vw,34px);font-weight:700;letter-spacing:-.03em;line-height:1;color:var(--muted);white-space:nowrap}
  .sum-head .val .yr{font-size:13px;color:var(--muted-2);margin-top:8px}
  .sum-lines{border-top:1px solid var(--border);padding:22px 30px;display:flex;flex-direction:column;gap:10px}
  .sl{display:flex;justify-content:space-between;gap:16px;font-size:14px;color:var(--muted)}
  .sl b{color:var(--fg);font-weight:600;white-space:nowrap}
  .sl.tot{border-top:1px solid var(--border);margin-top:6px;padding-top:14px;color:var(--fg);font-weight:600}
  .hero-price{position:relative;background:linear-gradient(160deg,#0E1A12 0%,#0B0F0C 55%,#0A0A0A 100%);border:1px solid var(--green-line);border-radius:var(--r-2xl);padding:44px;overflow:hidden}
  .hero-price::before{content:"";position:absolute;inset:0;background:radial-gradient(700px 260px at 82% -10%,rgba(0,232,95,.13),transparent 70%);pointer-events:none}
  .hero-price .inner{position:relative;display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:center}
  .hero-price .inner.single{grid-template-columns:1fr;max-width:640px}
  .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,232,95,.1);border:1px solid var(--green-line);color:var(--green);font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;padding:7px 13px;border-radius:999px;margin-bottom:20px}
  .strike{font-size:16px;white-space:nowrap;color:var(--muted-2);text-decoration:line-through;text-decoration-color:var(--red);text-decoration-thickness:1.5px;margin-bottom:8px}
  .hero-price .big{font-size:clamp(40px,6vw,66px);font-weight:700;letter-spacing:-.04em;line-height:1;margin-bottom:6px;white-space:nowrap}
  .hero-price .per{font-size:14px;color:var(--muted);margin-bottom:8px}
  .plus{display:flex;align-items:center;gap:12px;margin:18px 0 26px;padding:16px 18px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:var(--r-md)}
  .plus .sig{font-size:22px;font-weight:300;color:var(--muted-2);line-height:1}
  .plus .t{font-size:13px;color:var(--muted-2);letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:2px}
  .plus .n2{font-size:24px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}
  .plus .n2 span{font-size:13px;font-weight:400;color:var(--muted-2)}
  .save{display:flex;flex-direction:column;gap:12px}
  .save-item{display:flex;gap:14px;align-items:flex-start;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 16px}
  .save-item .ico{flex:0 0 auto;width:22px;height:22px;border-radius:6px;background:rgba(0,232,95,.12);color:var(--green);display:grid;place-items:center;font-size:12px;font-weight:700;margin-top:1px}
  .save-item .t{font-size:14px;font-weight:600;line-height:1.4}
  .save-item .d{font-size:12.5px;color:var(--muted-2);margin-top:3px;line-height:1.5}
  .save-item .d b{color:var(--green);font-weight:600}
  .composition .lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--muted-2);margin-bottom:16px}
  .comp-row{display:flex;justify-content:space-between;gap:16px;font-size:14px;padding:9px 0;color:var(--muted)}
  .comp-row b{color:var(--fg);font-weight:600;white-space:nowrap}
  .comp-row.tot{border-top:1px solid var(--border);margin-top:8px;padding-top:16px;font-size:16px;color:var(--fg);font-weight:600}
  .comp-row.tot b{color:var(--green);font-size:20px}
  .comp-row.sep{margin-top:22px;padding-top:18px;border-top:1px solid var(--border)}
  .cond{margin-top:26px;padding:16px 18px;background:rgba(0,232,95,.05);border:1px solid var(--green-line);border-radius:var(--r-md);font-size:13px;color:var(--muted);line-height:1.55}
  .cond b{color:var(--green);font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:14px}
  thead th{text-align:left;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted-2);font-weight:700;padding:0 18px 14px;border-bottom:1px solid var(--border)}
  thead th.num-h,tbody td.r{text-align:right}
  tbody td{padding:16px 18px;border-bottom:1px solid var(--border);color:var(--muted);vertical-align:middle}
  tbody tr:last-child td{border-bottom:none}
  tbody td.lbl{color:var(--fg);font-weight:500}
  tbody td b{color:var(--fg);font-weight:600}
  .col-hi{background:rgba(0,232,95,.045)}
  th.col-hi{color:var(--green)}
  td.col-hi b{color:var(--green)}
  .pill{display:inline-block;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:var(--border);color:var(--muted)}
  .pill.ok{background:rgba(0,232,95,.12);color:var(--green)}
  .pill.no{background:rgba(239,68,68,.1);color:#F87171}
  .why{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .why .risk{background:var(--card);border:1px solid var(--border);border-radius:var(--r-xl);padding:26px}
  .why .risk .h{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .why .risk .dot{width:8px;height:8px;border-radius:50%;background:var(--amber)}
  .why .risk h3{font-size:17px;margin:0}
  .why .risk p{font-size:14px;margin:0}
  .why .risk .out{margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:13px;color:#F87171}
  .together{margin-top:20px;background:var(--card-2);border:1px solid var(--green-line);border-radius:var(--r-xl);padding:30px}
  .together h3{color:var(--green);font-size:18px}
  .together p{font-size:15px;margin-bottom:0;color:var(--muted)}
  .terms{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
  .term{background:var(--card);padding:22px 24px}
  .term .k{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted-2);font-weight:700;margin-bottom:7px}
  .term .v{font-size:14.5px;color:var(--fg);font-weight:500;line-height:1.5}
  .term .v span{display:block;color:var(--muted-2);font-size:12.5px;font-weight:400;margin-top:4px}
  .close{background:linear-gradient(160deg,#0E1A12,#0A0A0A);border:1px solid var(--green-line);border-radius:var(--r-2xl);padding:44px}
  .close h2{margin-bottom:14px}
  .close p{font-size:16px;max-width:70ch}
  .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}
  .step{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:var(--r-md);padding:18px}
  .step .n{width:24px;height:24px;border-radius:7px;background:var(--green);color:#0A0A0A;font-size:12px;font-weight:800;display:grid;place-items:center;margin-bottom:12px}
  .step .t{font-size:14px;font-weight:600;margin-bottom:4px}
  .step .d{font-size:12.5px;color:var(--muted-2);line-height:1.5}
  footer{border-top:1px solid var(--border);padding:44px 0 56px;text-align:center}
  footer img{height:26px;opacity:.7;margin-bottom:18px}
  footer .tag{font-size:14px;color:var(--muted);margin-bottom:8px}
  footer .meta{font-size:12px;color:var(--muted-2)}
  @media (max-width:900px){
    .wrap{padding:0 20px}
    section{padding:60px 0}
    .grid-2,.why,.steps,.terms{grid-template-columns:1fr}
    .hero-price{padding:30px}
    .hero-price .inner{grid-template-columns:1fr;gap:32px}
    .sum-head{grid-template-columns:1fr}
    .sum-head .val{text-align:left}
    .anchor-row{grid-template-columns:1fr;gap:8px}
    .anchor-row .base,.anchor-row .cost{text-align:left}
    .table-scroll{overflow-x:auto}
    table{min-width:660px}
  }
  @media print{
    body{background:#0A0A0A;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    section{page-break-inside:avoid;padding:44px 0}
    .hero-price,.close,.scen{page-break-inside:avoid}
  }
`;

export interface RenderOptions {
  /** Logo da O2 embutida como data URL. Sem ela, cai no wordmark em texto. */
  logoO2DataUrl?: string;
}

function coverSection(m: ProposalModel, c: ProposalComputed, opts: RenderOptions): string {
  const o2 = opts.logoO2DataUrl
    ? `<img class="o2" src="${opts.logoO2DataUrl}" alt="O2 Inc.">`
    : `<span class="o2-text">O2</span>`;
  const cli = m.client.logoDataUrl
    ? `<img class="cli" src="${m.client.logoDataUrl}" alt="${esc(m.client.name)}">`
    : `<span class="cli-text">${esc(m.client.name)}</span>`;

  const facts: string[] = [
    `<div class="fact"><div class="k">Cliente</div><div class="v">${esc(m.client.name)}${
      m.client.cnpjCount && m.client.cnpjCount > 1
        ? `<span>Grupo com ${m.client.cnpjCount} CNPJs</span>`
        : ""
    }</div></div>`,
  ];
  if (m.client.monthlyRevenue) {
    facts.push(
      `<div class="fact"><div class="k">Faturamento</div><div class="v num">${money(m.client.monthlyRevenue)} / mês</div></div>`,
    );
  }
  if (m.client.profile) {
    facts.push(
      `<div class="fact"><div class="k">Perfil</div><div class="v">${esc(m.client.profile)}</div></div>`,
    );
  }
  facts.push(
    `<div class="fact"><div class="k">Emissão</div><div class="v">${dateBR(c.date)}</div></div>`,
  );

  const sub =
    m.subheadline ??
    (c.hasClosing
      ? `Estrutura financeira para a ${esc(m.client.name)} com uma condição única de fechamento para a contratação conjunta.`
      : `Estrutura financeira para a ${esc(m.client.name)}, com o investimento comparado ao custo de montar a mesma equipe na folha.`);

  return `<div class="wrap cover">
  <div class="logos">${o2}<span class="x">×</span>${cli}</div>
  <p class="eyebrow">Proposta comercial${c.isBundle ? " · Escopo integrado" : ""}</p>
  <h1>${esc(c.headline)}</h1>
  <p class="sub">${sub}</p>
  <div class="facts">${facts.join("")}</div>
</div>`;
}

function painsSection(m: ProposalModel): string {
  if (!m.pains?.length) return "";
  const cards = m.pains
    .map(
      (p, i) => `<div class="pain">
        <div class="n">DOR ${String(i + 1).padStart(2, "0")}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        ${p.quote ? `<div class="quote">"${esc(p.quote)}"</div>` : ""}
      </div>`,
    )
    .join("");
  return `<section><div class="wrap">
    <p class="eyebrow neutral">O que ouvimos</p>
    <h2>O ponto de partida.</h2>
    <p class="lead">As dores abaixo saíram diretamente da conversa. Cada uma tem uma resposta concreta dentro do escopo proposto.</p>
    <div class="grid-2" style="margin-top:36px">${cards}</div>
  </div></section>`;
}

function cltSection(c: ProposalComputed): string {
  if (!c.clt) return "";
  const rows = c.clt.rows
    .map(
      (r) => `<div class="anchor-row">
      <div class="role">${esc(r.role)}${r.detail ? `<span>${esc(r.detail)}</span>` : ""}</div>
      <div class="base num">Salário ${money(r.salary)}<br><em>× ${String(c.clt!.factor).replace(".", ",")} encargos</em></div>
      <div class="cost num">${money(r.cost)}<small>/mês</small></div>
    </div>`,
    )
    .join("");
  return `<section><div class="wrap">
    <p class="eyebrow neutral">Referência de mercado</p>
    <h2>O que custa montar essa estrutura na sua folha.</h2>
    <p class="lead">Antes de falar do nosso preço, o comparável honesto: contratar as mesmas funções em regime CLT. Salário não é custo — custo é salário mais encargos, provisões e benefícios, algo em torno de <strong>${String(c.clt.factor).replace(".", ",")}×</strong> o valor bruto.</p>
    <div class="anchor-box" style="margin-top:36px">${rows}
      <div class="anchor-row total">
        <div class="role" style="font-size:16px">Estrutura interna equivalente<span>Sem contar recrutamento, curva de aprendizado, risco de turnover e passivo rescisório</span></div>
        <div class="base num" style="color:#A0A0A0">${money(c.clt.yearly)} / ano</div>
        <div class="cost num">${money(c.clt.monthly)}<small>/mês</small></div>
      </div>
    </div>
    <p class="note">Encargos considerados: INSS patronal 20%, FGTS 8%, provisão de 13º 8,33%, férias + 1/3 11,11% e benefícios (VR, plano de saúde, provisão rescisória). Não incluídos: custo de recrutamento, tempo de rampagem até o profissional produzir e o risco de a vaga ficar aberta.</p>
  </div></section>`;
}

function tableValuesSection(m: ProposalModel, c: ProposalComputed): string {
  const cards = m.services
    .map(
      (s, i) => `<div class="scen">
      <div class="tag">Serviço ${String(i + 1).padStart(2, "0")}</div>
      <h3>${esc(s.name)}</h3>
      <div class="role">${esc(s.role)}</div>
      <div class="price"><span class="v num">${money(s.monthly)}</span><span class="per">/mês</span></div>
      ${s.scope.length ? `<ul class="scope">${s.scope.slice(0, 8).map(scopeLi).join("")}</ul>` : ""}
    </div>`,
    )
    .join("");

  const gridStyle = m.services.length === 1 ? "max-width:520px" : "";
  const needsSum = c.isBundle || c.table.setupTotal > 0;

  const lines = [
    ...m.services.map(
      (s) =>
        `<div class="sl"><span>${esc(s.name)} — mensalidade</span><b class="num">${money(s.monthly)}</b></div>`,
    ),
    ...(c.table.setupTotal > 0 && m.setup
      ? [
          `<div class="sl"><span>${esc(m.setup.label)} — ${money(c.table.setupTotal)} em ${c.table.installments}×</span><b class="num">${money(c.table.setupInstallment)}</b></div>`,
        ]
      : []),
    `<div class="sl tot"><span>Desembolso mensal${c.table.setupTotal > 0 ? " no primeiro ano" : ""}</span><b class="num">${money(c.table.firstYearMonthly)}</b></div>`,
  ].join("");

  const sum = needsSum
    ? `<div class="sum">
      <div class="sum-head">
        <div>
          <div class="lbl">${c.hasClosing ? "Somados a preço de tabela" : "Investimento"}</div>
          <h3>${c.isBundle ? "As frentes somadas" : esc(m.services[0]?.name ?? "O serviço")}${c.hasClosing ? ", sem condição especial." : "."}</h3>
          ${m.setup ? `<p>Mais a ${esc(m.setup.label.toLowerCase())}, que estrutura a base de dados e implanta a plataforma.</p>` : ""}
        </div>
        <div class="val">
          <div class="big num">${money(c.table.firstYearMonthly)}</div>
          <div class="yr num">por mês${c.table.setupTotal > 0 ? " no primeiro ano" : ""} · ${money(c.table.firstYearTotal)}</div>
        </div>
      </div>
      <div class="sum-lines">${lines}</div>
    </div>`
    : "";

  return `<section><div class="wrap">
    <p class="eyebrow neutral">${c.hasClosing ? "Valores de tabela" : "Investimento"}</p>
    <h2>${c.isBundle ? "Cada serviço e o seu valor." : "O serviço e o seu valor."}</h2>
    <p class="lead">${
      c.isBundle
        ? "As frentes existem de forma autônoma e têm preço próprio, calculado para o perfil da empresa."
        : "Valor calculado para o perfil da empresa."
    }${c.hasClosing ? " Estes são os valores de tabela." : ""}</p>
    <div class="grid-2" style="margin-top:36px;${gridStyle}">${cards}</div>
    ${sum}
  </div></section>`;
}

function closingSection(m: ProposalModel, c: ProposalComputed): string {
  if (!c.closing || !m.closing) return "";
  const cl = c.closing;
  const saves: string[] = [];
  if (cl.monthlyDiscount > 0) {
    saves.push(`<div class="save-item"><div class="ico">↓</div><div>
      <div class="t">Na mensalidade</div>
      <div class="d"><b>${money(cl.monthlyDiscount)} por mês</b> abaixo da tabela — uma redução de ${pctStr(cl.monthlyDiscountPct)} sobre ${money(c.table.monthly)}.</div>
    </div></div>`);
  }
  if (cl.setupDiscount > 0) {
    saves.push(`<div class="save-item"><div class="ico">↓</div><div>
      <div class="t">No setup</div>
      <div class="d">De ${money(c.table.setupTotal)} para <b>${money(cl.setupTotal)}</b> — ${money(cl.setupDiscount)} a menos, com a parcela caindo de ${money(c.table.setupInstallment)} para ${money(cl.setupInstallment)}.</div>
    </div></div>`);
  }
  if (cl.firstYearSaving > 0) {
    saves.push(`<div class="save-item"><div class="ico">≡</div><div>
      <div class="t">No primeiro ano</div>
      <div class="d"><b>${money(cl.firstYearSaving)}</b> de economia — ${money(cl.firstYearTotal)} contra ${money(c.table.firstYearTotal)} a preço de tabela.</div>
    </div></div>`);
  }

  const plus =
    cl.setupTotal > 0
      ? `<div class="plus"><span class="sig">+</span><div>
        <div class="t">${esc(m.setup?.label ?? "Setup inicial")}</div>
        <div class="n2 num">${cl.installments}× ${money(cl.setupInstallment)} <span>no cartão · total ${money(cl.setupTotal)}</span></div>
      </div></div>`
      : "";

  return `<section><div class="wrap">
    <p class="eyebrow">Condição única de fechamento</p>
    <h2>${c.isBundle ? "Contratando as frentes juntas." : "Condição especial."}</h2>
    <p class="lead">${
      c.isBundle
        ? "Uma única condição, válida para a contratação conjunta: <strong>mensalidade fechada para todos os serviços</strong>"
        : "Condição especial de fechamento: <strong>mensalidade fechada</strong>"
    }${cl.setupTotal > 0 ? ` e setup reduzido, parcelado em ${cl.installments} vezes no cartão.` : "."}</p>
    <div class="hero-price" style="margin-top:36px">
      <div class="inner">
        <div>
          <div class="badge">◆ ${c.isBundle ? "Os serviços juntos" : "Condição de fechamento"}</div>
          <div class="strike num">${money(c.table.monthly)} /mês a preço de tabela</div>
          <div class="big num">${money(cl.monthly)}</div>
          <div class="per">por mês — ${esc(m.services.map((s) => shortServiceName(s.name)).join(" e "))}</div>
          ${plus}
          <div class="save">${saves.join("")}</div>
        </div>
        <div>
          <div class="composition">
            <div class="lbl">Desembolso na condição de fechamento</div>
            <div class="comp-row"><span>Mensalidade${c.isBundle ? " dos serviços" : ""}</span><b class="num">${money(cl.monthly)}</b></div>
            ${cl.setupTotal > 0 ? `<div class="comp-row"><span>${esc(m.setup?.label ?? "Setup inicial")} (${cl.installments}× no cartão)</span><b class="num">${money(cl.setupInstallment)}</b></div>` : ""}
            <div class="comp-row tot"><span>Desembolso mensal${cl.setupTotal > 0 ? ` — ${cl.installments} meses` : ""}</span><b class="num">${money(cl.firstYearMonthly)}</b></div>
          </div>
          ${cl.setupTotal > 0 ? `<div class="comp-row sep"><span>A partir do ${cl.installments + 1}º mês</span><b class="num" style="font-size:18px">${money(cl.recurringAfter)}</b></div>` : ""}
          ${c.revenueShare ? `<div class="comp-row"><span>Equivalente à receita mensal</span><b class="num">${pctStr(c.revenueShare.firstYear, 2)} / mês</b></div>` : ""}
          <div class="cond">${
            m.closing.note
              ? esc(m.closing.note)
              : c.isBundle
                ? `<b>Condição válida exclusivamente para a contratação conjunta</b> das frentes, dentro do prazo de validade desta proposta. Contratadas isoladamente, valem os valores de tabela apresentados acima.`
                : `<b>Condição válida dentro do prazo de validade desta proposta.</b>`
          }</div>
        </div>
      </div>
    </div>
  </div></section>`;
}

function comparisonSection(m: ProposalModel, c: ProposalComputed): string {
  if (!c.clt && !c.hasClosing) return "";
  const cols: Array<{ head: string; hi?: boolean; get: (row: string) => string }> = [];

  if (c.clt) {
    const clt = c.clt;
    cols.push({
      head: "Estrutura CLT",
      get: (row) =>
        ({
          monthly: `<b class="num">${money(clt.monthly)}</b>`,
          setup: "—",
          first: `<b class="num">${money(clt.monthly)}</b>`,
          year: `<span class="num">${money(clt.yearly)}</span>`,
          after: `<span class="num">${money(clt.monthly)}</span>`,
          share:
            c.revenueShare?.clt !== undefined
              ? `<span class="num">${pctStr(c.revenueShare.clt, 2)}</span>`
              : "—",
          ramp: "3–6 meses de rampagem",
          liability: `<span class="pill no">Assumido</span>`,
          exit: "Rescisão + verbas",
        })[row] ?? "",
    });
  }

  const tableCol = c.table;
  cols.push({
    head: c.hasClosing ? "Preço de tabela" : "Investimento proposto",
    hi: !c.hasClosing,
    get: (row) =>
      ({
        monthly: `<b class="num">${money(tableCol.monthly)}</b>`,
        setup:
          tableCol.setupTotal > 0 ? `<span class="num">${money(tableCol.setupTotal)}</span>` : "—",
        first: `<b class="num">${money(tableCol.firstYearMonthly)}</b>`,
        year: `<span class="num">${money(tableCol.firstYearTotal)}</span>`,
        after: `<span class="num">${money(tableCol.recurringAfter)}</span>`,
        share:
          c.revenueShare && !c.hasClosing
            ? `<span class="num">${pctStr(c.revenueShare.firstYear, 2)}</span>`
            : "—",
        ramp: "Semana 1",
        liability: `<span class="pill ok">Nenhum</span>`,
        exit: `Aviso de ${c.noticeDays} dias`,
      })[row] ?? "",
  });

  if (c.closing) {
    const cl = c.closing;
    cols.push({
      head: "Condição de fechamento",
      hi: true,
      get: (row) =>
        ({
          monthly: `<b class="num">${money(cl.monthly)}</b>`,
          setup: cl.setupTotal > 0 ? `<b class="num">${money(cl.setupTotal)}</b>` : "—",
          first: `<b class="num">${money(cl.firstYearMonthly)}</b>`,
          year: `<b class="num">${money(cl.firstYearTotal)}</b>`,
          after: `<b class="num">${money(cl.recurringAfter)}</b>`,
          share: c.revenueShare ? `<b class="num">${pctStr(c.revenueShare.firstYear, 2)}</b>` : "—",
          ramp: `<b>Semana 1</b>`,
          liability: `<span class="pill ok">Nenhum</span>`,
          exit: `<b>Aviso de ${c.noticeDays} dias</b>`,
        })[row] ?? "",
    });
  }

  const rowDefs: Array<[string, string]> = [
    ["monthly", c.isBundle ? "Mensalidade das funções" : "Mensalidade"],
    ...(c.table.setupTotal > 0
      ? ([["setup", m.setup?.label ?? "Setup inicial"]] as Array<[string, string]>)
      : []),
    ["first", `Desembolso mensal${c.table.setupTotal > 0 ? " no 1º ano" : ""}`],
    ["year", "Total do primeiro ano"],
    ...(c.table.setupTotal > 0
      ? ([["after", `A partir do ${c.table.installments + 1}º mês`]] as Array<[string, string]>)
      : []),
    ...(c.revenueShare
      ? ([["share", "Equivalente à receita mensal"]] as Array<[string, string]>)
      : []),
    ...(c.clt ? ([["ramp", "Tempo até estar produzindo"]] as Array<[string, string]>) : []),
    ...(c.clt
      ? ([["liability", "Passivo trabalhista e rescisório"]] as Array<[string, string]>)
      : []),
    ["exit", "Saída do contrato"],
  ];

  const head = cols
    .map((col) => `<th class="num-h${col.hi ? " col-hi" : ""}">${col.head}</th>`)
    .join("");
  const body = rowDefs
    .map(
      ([key, label]) =>
        `<tr><td class="lbl">${esc(label)}</td>${cols
          .map((col) => `<td class="r${col.hi ? " col-hi" : ""}">${col.get(key)}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const note = c.vsClt
    ? `<p class="note">${c.hasClosing ? "A condição de fechamento fica" : "O investimento proposto fica"} <strong>${pctStr(c.vsClt.pctBelowFirstYear)} abaixo</strong> da estrutura CLT equivalente no primeiro ano — ${money(c.vsClt.yearlySaving)} a menos${
        c.table.setupTotal > 0
          ? ` — e <strong>${pctStr(c.vsClt.pctBelowRecurring)} abaixo</strong> na recorrência.`
          : "."
      }</p>`
    : "";

  return `<section><div class="wrap">
    <p class="eyebrow neutral">Comparativo</p>
    <h2>Os caminhos, lado a lado.</h2>
    <div class="table-scroll" style="margin-top:36px">
      <table>
        <thead><tr><th style="width:32%">&nbsp;</th>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    ${note}
  </div></section>`;
}

const BUNDLE_RISKS: Record<string, { title: string; body: string; out: string }> = {
  cfo: {
    title: "Só o CFO",
    body: "A estratégia fica correta e a decisão bem fundamentada — mas depende da equipe atual para executar. Sem ninguém cobrando cadência, o CFO sênior passa o tempo conferindo lançamento e refazendo relatório.",
    out: "Resultado: você paga hora de diretor para receber trabalho de analista. O plano existe; a execução não acompanha.",
  },
  coordenador: {
    title: "Só o Coordenador",
    body: "A operação fica organizada, o dado nasce limpo e o fechamento sai no prazo. Mas ninguém traduz esse dado confiável em decisão: qual dívida renegociar, onde está a margem, como se preparar para captar.",
    out: "Resultado: rotina impecável, resultado inalterado. Você organiza o que já fazia, sem mudar para onde vai.",
  },
  bpo: {
    title: "Só o BPO",
    body: "A rotina sai da sua mão e passa a rodar com padrão. Mas execução terceirizada sem leitura estratégica não muda prioridade: as contas são pagas em ordem, não em critério.",
    out: "Resultado: menos esforço operacional, mesma qualidade de decisão.",
  },
};

function whyBundleSection(m: ProposalModel, c: ProposalComputed): string {
  if (!c.isBundle) return "";
  const risks = m.services.map((s) => BUNDLE_RISKS[s.key]).filter(Boolean);
  if (risks.length < 2) return "";
  const cards = risks
    .slice(0, 2)
    .map(
      (r) => `<div class="risk">
      <div class="h"><span class="dot"></span><h3>${esc(r!.title)}</h3></div>
      <p>${esc(r!.body)}</p>
      <div class="out">${esc(r!.out)}</div>
    </div>`,
    )
    .join("");
  return `<section><div class="wrap">
    <p class="eyebrow neutral">O argumento técnico</p>
    <h2>${c.hasClosing ? "Por que a condição existe só para os serviços juntos." : "Por que as frentes andam juntas."}</h2>
    <p class="lead">Não é volume de contrato — é mecânica de entrega. Cada serviço isolado falha por um motivo previsível, e sempre o mesmo.</p>
    <div class="why" style="margin-top:36px">${cards}</div>
    <div class="together">
      <h3>Juntos, um cobre exatamente o ponto cego do outro</h3>
      <p>Um único mapeamento de dados, uma única integração com o ERP, uma única cadência de governança — todos olhando para o mesmo número. Quem decide o rumo responde pelo resultado; quem executa garante que a decisão vira rotina cumprida e que o dado da próxima decisão é confiável.</p>
    </div>
  </div></section>`;
}

function termsSection(m: ProposalModel, c: ProposalComputed): string {
  const active = c.closing ?? c.table;
  const terms: string[] = [
    `<div class="term"><div class="k">Mensalidade</div><div class="v">${formatBRL(active.monthly)}<span>${esc(
      m.services.map((s) => s.name).join(" + "),
    )}</span></div></div>`,
  ];
  if (active.setupTotal > 0 && m.setup) {
    terms.push(
      `<div class="term"><div class="k">${esc(m.setup.label)}</div><div class="v">${active.installments}× de ${formatBRL(active.setupInstallment)}<span>Total de ${formatBRL(active.setupTotal)} no cartão de crédito</span></div></div>`,
      `<div class="term"><div class="k">Desembolso nos ${active.installments} primeiros meses</div><div class="v">${formatBRL(active.firstYearMonthly)} / mês<span>Mensalidade mais a parcela do setup</span></div></div>`,
      `<div class="term"><div class="k">A partir do ${active.installments + 1}º mês</div><div class="v">${formatBRL(active.recurringAfter)} / mês<span>Recorrência com o setup quitado</span></div></div>`,
    );
  }
  terms.push(
    `<div class="term"><div class="k">Multa rescisória</div><div class="v">Não há<span>Apenas aviso prévio de ${c.noticeDays} dias por qualquer das partes</span></div></div>`,
  );
  if (m.client.cnpjCount && m.client.cnpjCount > 1) {
    terms.push(
      `<div class="term"><div class="k">Escopo por CNPJ</div><div class="v">Os ${m.client.cnpjCount} CNPJs do grupo</div></div>`,
    );
  }

  const isolatedNote =
    c.hasClosing && c.isBundle
      ? `<p class="note">Condição de fechamento vinculada à contratação conjunta. Na contratação isolada de qualquer uma das frentes, aplicam-se os valores de tabela: ${m.services
          .map((s) => `${esc(s.name)} ${money(s.monthly)}/mês`)
          .join(
            ", ",
          )}${m.setup ? ` e ${esc(m.setup.label.toLowerCase())} de ${money(c.table.setupTotal)}` : ""}.</p>`
      : "";

  return `<section><div class="wrap">
    <p class="eyebrow neutral">Condições comerciais</p>
    <h2>Como o contrato funciona.</h2>
    <div class="terms" style="margin-top:36px">${terms.join("")}</div>
    ${isolatedNote}
  </div></section>`;
}

function recommendationSection(m: ProposalModel, c: ProposalComputed): string {
  const active = c.closing ?? c.table;
  const bits: string[] = [];
  if (c.closing && c.closing.firstYearSaving > 0) {
    bits.push(
      `<strong>${money(c.closing.firstYearSaving)} abaixo</strong> do preço de tabela no primeiro ano`,
    );
  }
  if (c.vsClt) {
    bits.push(`<strong>${pctStr(c.vsClt.pctBelowFirstYear)} abaixo</strong> da folha equivalente`);
  }
  const text =
    m.recommendation ??
    `${
      c.isBundle
        ? "Nenhuma das frentes isoladas resolve o quadro: a estratégia sem execução vira plano guardado, e a execução sem estratégia vira eficiência no lugar errado."
        : "O escopo foi desenhado para o estágio atual da empresa."
    } ${c.isBundle ? "Contratadas juntas, saem" : "O investimento fica"} por <strong>${money(active.monthly)} por mês</strong>${
      active.setupTotal > 0
        ? ` com setup em ${active.installments}× de ${money(active.setupInstallment)}`
        : ""
    }${bits.length ? `: ${bits.join(", ")}` : ""}, e começando a produzir na primeira semana.`;

  return `<section><div class="wrap">
    <div class="close">
      <p class="eyebrow">Recomendação</p>
      <h2>O próximo passo.</h2>
      <p>${text}</p>
      <div class="steps">
        <div class="step"><div class="n">1</div><div class="t">Aprovação do escopo</div><div class="d">Validação do investimento e das condições comerciais com a diretoria.</div></div>
        <div class="step"><div class="n">2</div><div class="t">Assinatura e kick-off</div><div class="d">Contrato assinado e reunião de kick-off agendada em até 5 dias úteis.</div></div>
        <div class="step"><div class="n">3</div><div class="t">Semana 1</div><div class="d">Diagnóstico iniciado e time O2 em onboarding.</div></div>
      </div>
    </div>
  </div></section>`;
}

export function renderProposalHTML(model: ProposalModel, opts: RenderOptions = {}): string {
  const c = deriveProposal(model);
  const logo = opts.logoO2DataUrl
    ? `<img src="${opts.logoO2DataUrl}" alt="O2 Inc.">`
    : `<div style="font-size:22px;font-weight:800;color:#00E85F;margin-bottom:18px">O2</div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>O2 Inc. × ${esc(model.client.name)} — Proposta</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>${STYLES}</style>
</head>
<body>
${coverSection(model, c, opts)}
${painsSection(model)}
${cltSection(c)}
${tableValuesSection(model, c)}
${closingSection(model, c)}
${comparisonSection(model, c)}
${whyBundleSection(model, c)}
${termsSection(model, c)}
${recommendationSection(model, c)}
<footer><div class="wrap">
  ${logo}
  <div class="tag">Compreender pessoas, oxigenar negócios.</div>
  <div class="meta">Documento preparado para ${esc(model.client.name)} · ${dateBR(c.date)} · Proposta válida por ${c.validityDays} dias</div>
</div></footer>
</body>
</html>`;
}
