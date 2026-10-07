import { describe, expect, it } from "vitest";
import { renderCFOProposalHTML } from "@/lib/proposal/cfo-html";
import { proposalService, type ProposalModel } from "@/lib/proposal";

function model(closing?: ProposalModel["closing"]): ProposalModel {
  return {
    client: { name: "Acme <Ltda>", monthlyRevenue: 1_200_000, cnpjCount: 2 },
    date: "2026-10-07",
    services: [proposalService("cfo", "CFO as a Service", 12000)],
    setup: {
      label: "Estruturação Financeira",
      total: 24000,
      installments: 12,
      deliverables: ["Kick-off"],
    },
    closing,
  };
}

describe("renderCFOProposalHTML", () => {
  it("mostra os valores abertos, sem botão de revelar nem âncora CLT", () => {
    const html = renderCFOProposalHTML(model());
    expect(html).toContain("R$ 12.000,00");
    expect(html).toContain("12× R$ 2.000,00");
    expect(html).toContain("R$ 14.000,00");
    expect(html).not.toContain("R$ 24.000,00");
    expect(html).not.toContain("Revelar investimento");
    expect(html).not.toContain("CLT");
    expect(html).toContain("Outubro de 2026");
    expect(html).toContain("2 CNPJs");
  });

  it("escapa o nome do cliente", () => {
    const html = renderCFOProposalHTML(model());
    expect(html).toContain("Acme &lt;Ltda&gt;");
    expect(html).not.toContain("Acme <Ltda>");
  });

  it("risca o valor de tabela quando há condição de fechamento", () => {
    const html = renderCFOProposalHTML(
      model({ monthly: 10800, setupTotal: 21600, installments: 12 }),
    );
    expect(html).toContain('<span class="was money">R$ 12.000,00</span>');
    expect(html).toContain("R$ 10.800,00");
    expect(html).toContain("Condição de fechamento");
  });

  it("não usa travessão no texto", () => {
    expect(renderCFOProposalHTML(model())).not.toMatch(/[—–]/);
  });
});
