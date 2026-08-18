import { loadO2Logo } from "./assets";
import { renderProposalHTML } from "./html";
import { deriveProposal, shortServiceName, type ProposalModel } from "./model";

export * from "./model";
export { renderProposalHTML } from "./html";
export { fileToDataUrl, loadO2Logo, urlToDataUrl } from "./assets";
export { toCalcPDFInput } from "./to-pdf";
export { proposalService, PROPOSAL_ROLES, PROPOSAL_SCOPES } from "./scopes";

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function proposalFileName(model: ProposalModel): string {
  const client = slug(model.client.name || "cliente");
  const services = model.services.map((s) => slug(shortServiceName(s.name))).join("-");
  return `proposta-${client}${services ? `-${services}` : ""}.html`;
}

/**
 * Renderiza a proposta e dispara o download do arquivo HTML autocontido.
 * Busca a logo da O2 no momento da geração e a embute como data URL.
 */
export async function downloadProposalHTML(model: ProposalModel): Promise<void> {
  const logoO2DataUrl = await loadO2Logo();
  const html = renderProposalHTML(model, { logoO2DataUrl });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = proposalFileName(model);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Abre a proposta em uma nova aba, para revisar antes de enviar. */
export async function previewProposalHTML(model: ProposalModel): Promise<void> {
  const logoO2DataUrl = await loadO2Logo();
  const html = renderProposalHTML(model, { logoO2DataUrl });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
}

export { deriveProposal };
