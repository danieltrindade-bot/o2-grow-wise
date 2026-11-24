import { describe, expect, it } from "vitest";
import { SERVICE_DETAILS } from "@/lib/service-scopes";
import { PROPOSAL_SCOPES } from "@/lib/proposal/scopes";

describe("cadência da Assessoria", () => {
  const labels = SERVICE_DETAILS.assessoria.pillars?.[0].items.map((i) => `${i.label} | ${i.detail}`);

  it("usa reunião quinzenal e resposta em até 24h úteis", () => {
    expect(labels).toContain("Reunião fixa quinzenal | Decisão a cada 15 dias");
    expect(labels).toContain("Canal direto com o assessor | Resposta em até 24h úteis");
    expect(SERVICE_DETAILS.assessoria.deliverables).not.toContain("Reunião fixa semanal");
  });

  it("não altera a cadência do CFO", () => {
    expect(SERVICE_DETAILS.cfo.deliverables).toContain("Reunião fixa semanal");
    expect(SERVICE_DETAILS.cfo.deliverables).toContain("Disponibilidade diária");
  });

  it("proposta HTML descreve os rituais quinzenais", () => {
    const rituais = PROPOSAL_SCOPES.assessoria[0];
    expect(typeof rituais === "object" && rituais.text).toContain("reunião quinzenal");
    expect(typeof rituais === "object" && rituais.text).toContain("24h úteis");
    expect(PROPOSAL_SCOPES.cfo[0]).toMatchObject({ text: expect.stringContaining("reunião semanal") });
  });
});
