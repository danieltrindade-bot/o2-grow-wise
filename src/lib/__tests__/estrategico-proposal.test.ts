import { describe, expect, it } from "vitest";
import { renderEstrategicoProposalHTML, type ProposalModel } from "@/lib/proposal";

const model = (closing?: ProposalModel["closing"]): ProposalModel => ({
  client: { name: "Empresa Teste", monthlyRevenue: 500000 },
  date: "2026-11-25",
  services: [
    { key: "estrategico", name: "Diagnóstico Estratégico", role: "", monthly: 0, scope: [] },
  ],
  setup: { label: "Projeto", total: 24000, installments: 12 },
  closing,
});

describe("renderEstrategicoProposalHTML", () => {
  it("mostra 12x no cartão, 4x no boleto e o total, sem mensalidade", () => {
    const html = renderEstrategicoProposalHTML(model());
    expect(html).toContain("Empresa Teste × O2 · Diagnóstico Estratégico");
    expect(html).toMatch(/12× R\$\s2\.000,00/);
    expect(html).toMatch(/4× de R\$\s6\.000,00/);
    expect(html).toMatch(/Total de <strong>R\$\s24\.000,00/);
    expect(html).toContain("Financeiro");
    expect(html).toContain("Capital humano");
    expect(html).not.toContain("aviso prévio");
    expect(html).not.toContain("Condição de fechamento");
  });

  it("condição de fechamento risca o valor de tabela e mostra a economia", () => {
    const html = renderEstrategicoProposalHTML(
      model({ monthly: 0, setupTotal: 20400, installments: 12 }),
    );
    expect(html).toContain("Condição de fechamento");
    expect(html).toMatch(/class="was money">12× R\$\s2\.000,00/);
    expect(html).toMatch(/12× R\$\s1\.700,00/);
    expect(html).toMatch(/economiza <strong>R\$\s3\.600,00/);
  });

  it("escapa o nome do cliente", () => {
    const html = renderEstrategicoProposalHTML({ ...model(), client: { name: "<b>X</b>" } });
    expect(html).not.toContain("<b>X</b>");
  });
});
