import { describe, expect, it } from "vitest";
import {
  defaultHeadline,
  deriveProposal,
  scopeText,
  shortServiceName,
  type ProposalModel,
} from "@/lib/proposal/model";
import { renderProposalHTML } from "@/lib/proposal/html";
import { proposalFileName } from "@/lib/proposal";

const CFO = {
  key: "cfo",
  name: "CFO as a Service",
  role: "Liderança estratégica",
  monthly: 17491.16,
  scope: ["Comitê estratégico mensal"],
};
const COORD = {
  key: "coordenador",
  name: "Coordenador as a Service",
  role: "Execução tática",
  monthly: 7202.25,
  scope: ["Padronização de rotinas"],
};
const SETUP = { label: "Estruturação Financeira (Setup inicial)", total: 46000, installments: 12 };

function bethel(closing?: ProposalModel["closing"]): ProposalModel {
  return {
    client: { name: "Bethel Educação", monthlyRevenue: 5_000_000, cnpjCount: 3 },
    date: "2026-08-14",
    services: [CFO, COORD],
    setup: SETUP,
    closing,
  };
}

describe("deriveProposal — valores de tabela", () => {
  it("soma as mensalidades e parcela o setup", () => {
    const c = deriveProposal(bethel());
    expect(c.table.monthly).toBeCloseTo(24693.41, 2);
    expect(c.table.setupInstallment).toBeCloseTo(3833.33, 2);
    expect(c.table.firstYearMonthly).toBeCloseTo(28526.74, 2);
    expect(c.table.firstYearTotal).toBeCloseTo(342320.92, 2);
    expect(c.table.recurringAfter).toBeCloseTo(24693.41, 2);
  });

  it("marca bundle e ausência de condição especial", () => {
    const c = deriveProposal(bethel());
    expect(c.isBundle).toBe(true);
    expect(c.hasClosing).toBe(false);
    expect(c.closing).toBeUndefined();
  });

  it("deriva a âncora CLT a partir das chaves dos serviços", () => {
    const c = deriveProposal(bethel());
    expect(c.clt?.rows.map((r) => r.cost)).toEqual([58800, 15120]);
    expect(c.clt?.monthly).toBeCloseTo(73920, 2);
    expect(c.clt?.yearly).toBeCloseTo(887040, 2);
  });

  it("compara o cenário de tabela com a folha quando não há condição", () => {
    const c = deriveProposal(bethel());
    expect(c.vsClt?.pctBelowFirstYear).toBeCloseTo(61.41, 1);
    expect(c.vsClt?.yearlySaving).toBeCloseTo(544719.08, 1);
  });

  it("calcula o peso sobre a receita do cliente", () => {
    const c = deriveProposal(bethel());
    expect(c.revenueShare?.firstYear).toBeCloseTo(0.5705, 3);
    expect(c.revenueShare?.clt).toBeCloseTo(1.4784, 3);
  });
});

describe("deriveProposal — condição de fechamento", () => {
  const closing = { monthly: 15000, setupTotal: 30000, installments: 12 };

  it("calcula os descontos contra a tabela", () => {
    const c = deriveProposal(bethel(closing));
    expect(c.hasClosing).toBe(true);
    expect(c.closing?.monthlyDiscount).toBeCloseTo(9693.41, 2);
    expect(c.closing?.monthlyDiscountPct).toBeCloseTo(39.25, 1);
    expect(c.closing?.setupDiscount).toBe(16000);
    expect(c.closing?.setupDiscountPct).toBeCloseTo(34.78, 1);
  });

  it("calcula desembolso e economia do primeiro ano", () => {
    const c = deriveProposal(bethel(closing));
    expect(c.closing?.firstYearMonthly).toBe(17500);
    expect(c.closing?.firstYearTotal).toBe(210000);
    expect(c.closing?.firstYearSaving).toBeCloseTo(132320.92, 2);
    expect(c.closing?.firstYearSavingPct).toBeCloseTo(38.65, 1);
    expect(c.closing?.recurringAfter).toBe(15000);
  });

  it("passa a comparar o fechamento — não a tabela — com a folha CLT", () => {
    const c = deriveProposal(bethel(closing));
    expect(c.vsClt?.pctBelowFirstYear).toBeCloseTo(76.33, 1);
    expect(c.vsClt?.pctBelowRecurring).toBeCloseTo(79.71, 1);
    expect(c.revenueShare?.firstYear).toBeCloseTo(0.35, 2);
  });
});

describe("condição vinda do desconto da calculadora", () => {
  // Cenário real do CFO: tabela sem desconto + "Condição de fechamento na
  // reunião" (15%) aplicada sobre mensalidade e setup.
  const PERCENT = 15;
  const tabelaMensal = 17491.16;
  const tabelaSetup = 46000;
  const model: ProposalModel = {
    client: { name: "Acme", monthlyRevenue: 5_000_000 },
    services: [{ ...CFO, monthly: tabelaMensal }],
    setup: { ...SETUP, total: tabelaSetup },
    closing: {
      monthly: tabelaMensal * (1 - PERCENT / 100),
      setupTotal: tabelaSetup * (1 - PERCENT / 100),
      installments: 12,
    },
  };

  it("o desconto de 15% vira condição, e o de-para bate com o percentual", () => {
    const c = deriveProposal(model);
    expect(c.hasClosing).toBe(true);
    expect(c.closing?.monthlyDiscountPct).toBeCloseTo(PERCENT, 6);
    expect(c.closing?.setupDiscountPct).toBeCloseTo(PERCENT, 6);
    expect(c.closing?.monthly).toBeCloseTo(14867.49, 2);
    expect(c.closing?.setupTotal).toBe(39100);
  });

  it("a economia do primeiro ano equivale a 15% do total de tabela", () => {
    const c = deriveProposal(model);
    expect(c.closing?.firstYearSavingPct).toBeCloseTo(PERCENT, 6);
  });

  it("renderiza tabela riscada e valor com desconto no HTML", () => {
    const html = renderProposalHTML(model);
    expect(html).toContain("Condição única de fechamento");
    expect(html).toContain('class="strike num">R$ 17.491');
    expect(html).toContain("R$ 14.867");
    expect(html).toContain("Valores de tabela");
  });
});

describe("deriveProposal — serviço único", () => {
  const single: ProposalModel = {
    client: { name: "Acme" },
    services: [CFO],
    setup: SETUP,
  };

  it("não marca bundle e ancora só o cargo do serviço", () => {
    const c = deriveProposal(single);
    expect(c.isBundle).toBe(false);
    expect(c.clt?.rows).toHaveLength(1);
    expect(c.clt?.monthly).toBe(58800);
  });

  it("funciona sem setup", () => {
    const c = deriveProposal({ ...single, setup: undefined });
    expect(c.table.setupInstallment).toBe(0);
    expect(c.table.firstYearMonthly).toBeCloseTo(17491.16, 2);
    expect(c.table.firstYearTotal).toBeCloseTo(209893.92, 2);
  });

  it("omite a comparação de receita quando o faturamento não é informado", () => {
    expect(deriveProposal(single).revenueShare).toBeUndefined();
  });
});

describe("headline", () => {
  it("junta os serviços curtos com o nome do cliente", () => {
    expect(defaultHeadline(bethel())).toBe(
      "CFO + Coordenador = a combinação certa para a Bethel Educação",
    );
  });

  it("usa forma singular com um serviço", () => {
    expect(defaultHeadline({ client: { name: "Acme" }, services: [CFO] })).toBe("CFO para a Acme");
  });

  it("respeita o headline informado", () => {
    const c = deriveProposal({ ...bethel(), headline: "Título manual" });
    expect(c.headline).toBe("Título manual");
  });

  it("remove o sufixo as a Service", () => {
    expect(shortServiceName("CFO as a Service")).toBe("CFO");
    expect(shortServiceName("BPO Financeiro")).toBe("BPO Financeiro");
  });
});

describe("escopo agrupado", () => {
  const grouped = {
    ...CFO,
    scope: [
      {
        label: "Rituais",
        text: "disponibilidade diária, reunião semanal, comitê estratégico mensal",
      },
      { label: "Construção", text: "DRE, Fluxo de Caixa, Ciclo Financeiro, forecast 30/60/90" },
      "Item simples sem rótulo",
    ],
  };

  it("renderiza o rótulo em negrito e o texto ao lado", () => {
    const html = renderProposalHTML({ client: { name: "Acme" }, services: [grouped] });
    expect(html).toContain("<li><b>Rituais:</b> disponibilidade diária, reunião semanal");
    expect(html).toContain("<li><b>Construção:</b> DRE, Fluxo de Caixa");
  });

  it("mantém string simples como bullet corrido", () => {
    const html = renderProposalHTML({ client: { name: "Acme" }, services: [grouped] });
    expect(html).toContain("<li>Item simples sem rótulo</li>");
  });

  it("escapa rótulo e texto", () => {
    const html = renderProposalHTML({
      client: { name: "Acme" },
      services: [{ ...CFO, scope: [{ label: "<b>x", text: "a & b" }] }],
    });
    expect(html).toContain("&lt;b&gt;x:");
    expect(html).toContain("a &amp; b");
  });

  it("converte para texto plano no PDF", () => {
    expect(scopeText({ label: "Rituais", text: "reunião semanal" })).toBe(
      "Rituais: reunião semanal",
    );
    expect(scopeText("Item simples")).toBe("Item simples");
  });
});

describe("proposalFileName", () => {
  it("gera slug do cliente e dos serviços", () => {
    expect(proposalFileName(bethel())).toBe("proposta-bethel-educacao-cfo-coordenador.html");
  });

  it("lida com acentos, símbolos e espaços", () => {
    expect(
      proposalFileName({ client: { name: "Óticas do Povo & Cia. Ltda" }, services: [CFO] }),
    ).toBe("proposta-oticas-do-povo-cia-ltda-cfo.html");
  });

  it("cai em cliente quando o nome está vazio", () => {
    expect(proposalFileName({ client: { name: "" }, services: [] })).toBe("proposta-cliente.html");
  });
});

describe("renderProposalHTML", () => {
  it("usa o nome do cliente na capa, no rodapé e no título", () => {
    const html = renderProposalHTML({ ...bethel(), client: { name: "Grupo Alfa" } });
    expect(html).toContain("<title>O2 Inc. × Grupo Alfa — Proposta</title>");
    expect(html).toContain("combinação certa para a Grupo Alfa");
    expect(html).toContain("Documento preparado para Grupo Alfa");
  });

  it("omite a seção de fechamento quando não há condição", () => {
    const html = renderProposalHTML(bethel());
    expect(html).not.toContain("Condição única de fechamento");
    expect(html).toContain("Referência de mercado");
    expect(html).toContain("R$ 28.526");
  });

  it("inclui a seção de fechamento e o valor riscado quando há condição", () => {
    const html = renderProposalHTML(
      bethel({ monthly: 15000, setupTotal: 30000, installments: 12 }),
    );
    expect(html).toContain("Condição única de fechamento");
    expect(html).toContain("R$ 15.000");
    expect(html).toContain("R$ 17.500");
    expect(html).toContain('class="strike num">R$ 24.693');
  });

  it("omite o argumento de bundle com serviço único", () => {
    const html = renderProposalHTML({ client: { name: "Acme" }, services: [CFO], setup: SETUP });
    expect(html).not.toContain("O argumento técnico");
  });

  it("escapa o nome do cliente", () => {
    const html = renderProposalHTML({
      client: { name: 'Acme <script>alert("x")</script>' },
      services: [CFO],
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renderiza dores quando informadas", () => {
    const html = renderProposalHTML({
      ...bethel(),
      pains: [
        {
          title: "Sem liderança",
          description: "Ninguém acima da operação",
          quote: "falta governança",
        },
      ],
    });
    expect(html).toContain("DOR 01");
    expect(html).toContain("Sem liderança");
    expect(html).toContain("falta governança");
  });
});
