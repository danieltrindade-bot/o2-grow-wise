import { formatBRL } from "./format";

async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  return { jsPDF, autoTable };
}

export { formatBRL };

type Doc = InstanceType<Awaited<ReturnType<typeof getJsPDF>>["jsPDF"]>;

const TODAY = () =>
  new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const GREEN: [number, number, number] = [0, 232, 95];
const DARK_1: [number, number, number] = [26, 26, 26];
const DARK_2: [number, number, number] = [42, 42, 42];
const DARK_3: [number, number, number] = [51, 51, 51];
const GRAY: [number, number, number] = [136, 136, 136];
const LIGHT_GRAY: [number, number, number] = [187, 187, 187];
const WHITE: [number, number, number] = [255, 255, 255];

function pageBg(doc: Doc) {
  doc.setFillColor(...DARK_1);
  doc.rect(0, 0, 210, 297, "F");
}

function header(doc: Doc, title: string, subtitle?: string) {
  pageBg(doc);
  doc.setFillColor(...DARK_2);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("O2", 14, 18);
  doc.setTextColor(...WHITE);
  doc.setFontSize(13);
  doc.text(title, 30, 14);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(subtitle, 30, 21);
  }
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text(`Gerado em ${TODAY()}`, 196, 14, { align: "right" });
  doc.setTextColor(...WHITE);
}

function footer(doc: Doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`O2 Inc — Página ${i}/${pageCount}`, 105, 290, { align: "center" });
  }
}

function highlightValue(doc: Doc, label: string, value: string, y: number) {
  doc.setFillColor(...DARK_2);
  doc.setDrawColor(...GREEN);
  doc.roundedRect(14, y, 182, 22, 3, 3, "FD");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(label.toUpperCase(), 20, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...GREEN);
  doc.text(value, 20, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...WHITE);
}

function darkTableStyles(fontSize: number) {
  return {
    headStyles: { fillColor: DARK_3, textColor: GREEN },
    styles: { fontSize, textColor: LIGHT_GRAY, fillColor: DARK_2 },
    alternateRowStyles: { fillColor: DARK_1 },
    didDrawPage: (data: any) => {
      if (data.pageNumber > 1) {
        const d = data.doc;
        d.setFillColor(...DARK_1);
        d.rect(0, 0, 210, 297, "F");
      }
    },
  };
}

export interface CalcPDFInput {
  service: string;
  clientName?: string;
  monthlyRevenue?: number;
  rows: Array<[string, string]>;
  finalLabel: string;
  finalValue: string;
  fileName?: string;
}

export async function exportCalculatorPDF(input: CalcPDFInput) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF();
  header(doc, input.service, "Proposta comercial");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("Dados do cliente", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...LIGHT_GRAY);
  let y = 47;
  if (input.clientName) {
    doc.text(`Empresa: ${input.clientName}`, 14, y);
    y += 6;
  }
  if (input.monthlyRevenue !== undefined) {
    doc.text(`Faturamento mensal: ${formatBRL(input.monthlyRevenue)}`, 14, y);
    y += 6;
  }

  autoTable(doc, {
    startY: y + 4,
    head: [["Variável", "Valor"]],
    body: input.rows,
    ...darkTableStyles(10),
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 30;
  highlightValue(doc, input.finalLabel, input.finalValue, finalY + 8);

  footer(doc);
  doc.save(input.fileName ?? `O2-${input.service.replace(/\s+/g, "-")}.pdf`);
}

export interface DiagnosticPDFInput {
  companyName: string;
  consultantName: string;
  date: string;
  grade: number;
  maturityLabel: string;
  maturityDescription: string;
  costRows: Array<{ label: string; value: string }>;
  costTotal?: string;
  outcomeRows: Array<{ current: string; future: string }>;
  recommendation: { service: string; tagline: string };
}

export async function exportDiagnosticPDF(input: DiagnosticPDFInput) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF();
  header(doc, "Diagnóstico Financeiro", input.companyName);

  doc.setFontSize(10);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text(`Empresa: ${input.companyName}`, 14, 40);
  doc.text(`Consultor: ${input.consultantName}`, 14, 46);
  doc.text(`Data: ${input.date}`, 14, 52);

  doc.setFillColor(...DARK_2);
  doc.setDrawColor(...GREEN);
  doc.roundedRect(14, 58, 182, 22, 3, 3, "FD");
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text("NOTA DE MATURIDADE", 20, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text(`${input.grade}/10`, 20, 76);
  doc.setFontSize(11);
  doc.text(input.maturityLabel, 60, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(input.maturityDescription, 60, 76);
  doc.setTextColor(...WHITE);

  let y = 90;
  if (input.costRows.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...WHITE);
    doc.text("Estimativa de perdas mensais", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Gap identificado", "Estimativa mensal"]],
      body: input.costRows.map((r) => [r.label, r.value]),
      foot: input.costTotal ? [["Total estimado", input.costTotal]] : undefined,
      ...darkTableStyles(9),
      footStyles: { fillColor: DARK_3, textColor: [255, 80, 80], fontStyle: "bold" },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (input.outcomeRows.length) {
    if (y > 240) {
      doc.addPage();
      pageBg(doc);
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...WHITE);
    doc.text("O que muda em 90 dias", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Situação atual", "Em 90 dias com a O2"]],
      body: input.outcomeRows.map((r) => [r.current, r.future]),
      ...darkTableStyles(9),
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (y > 250) {
    doc.addPage();
    pageBg(doc);
    y = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text("Recomendação", 14, y);
  highlightValue(doc, input.recommendation.tagline, input.recommendation.service, y + 4);

  footer(doc);
  doc.save(`O2-Diagnostico-${input.companyName.replace(/\s+/g, "-")}.pdf`);
}

// --------------------------------------------------------------------------
// Feature 2: Full Proposal PDF
// --------------------------------------------------------------------------

export interface ProposalPDFInput {
  companyName: string;
  consultantName: string;
  date: string;
  grade: number;
  maturityLabel: string;
  maturityDescription: string;
  costRows: Array<{ label: string; value: string }>;
  costTotal?: string;
  outcomeRows: Array<{ current: string; future: string }>;
  recommendation: { service: string; tagline: string; reason: string };
  complementary?: { service: string; reason: string };
  notes?: string;
}

export async function exportProposalPDF(input: ProposalPDFInput) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF();

  // -- Cover page --
  doc.setFillColor(...DARK_1);
  doc.rect(0, 0, 210, 297, "F");

  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.text("O2", 105, 80, { align: "center" });

  doc.setTextColor(...WHITE);
  doc.setFontSize(24);
  doc.text("Proposta Comercial", 105, 110, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Diagnóstico Financeiro e Recomendação", 105, 125, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.text(input.companyName, 105, 170, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text(`Consultor: ${input.consultantName}`, 105, 185, { align: "center" });
  doc.text(`Data: ${input.date}`, 105, 195, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(85, 85, 85);
  doc.text("Documento confidencial — uso exclusivo da empresa destinatária", 105, 270, {
    align: "center",
  });

  // -- Page 1: Diagnostic result --
  doc.addPage();
  header(doc, "Resultado do Diagnóstico", input.companyName);

  doc.setFontSize(10);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text(`Empresa: ${input.companyName}`, 14, 40);
  doc.text(`Consultor: ${input.consultantName}`, 14, 46);
  doc.text(`Data: ${input.date}`, 14, 52);

  doc.setFillColor(...DARK_2);
  doc.setDrawColor(...GREEN);
  doc.roundedRect(14, 58, 182, 22, 3, 3, "FD");
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text("NOTA DE MATURIDADE", 20, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text(`${input.grade}/10`, 20, 76);
  doc.setFontSize(11);
  doc.text(input.maturityLabel, 60, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(input.maturityDescription, 60, 76);
  doc.setTextColor(...WHITE);

  // -- Page 2: Estimated losses --
  if (input.costRows.length) {
    doc.addPage();
    header(doc, "Estimativa de Perdas", input.companyName);

    let y = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...WHITE);
    doc.text("Quanto sua empresa pode estar perdendo", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    y += 8;
    doc.text(
      "Valores estimados com base nas respostas do diagnóstico e no faturamento mensal informado.",
      14,
      y,
    );
    doc.setTextColor(...WHITE);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Gap identificado", "Estimativa mensal"]],
      body: input.costRows.map((r) => [r.label, r.value]),
      foot: input.costTotal ? [["Total estimado", input.costTotal]] : undefined,
      ...darkTableStyles(10),
      footStyles: { fillColor: DARK_3, textColor: [255, 80, 80], fontStyle: "bold" },
    });
  }

  // -- Page 3: Outcomes --
  if (input.outcomeRows.length) {
    doc.addPage();
    header(doc, "O que muda em 90 dias", input.companyName);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...WHITE);
    doc.text("Transformação esperada com a O2", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text("Comparativo entre a situação atual e o cenário após 90 dias de parceria.", 14, 48);
    doc.setTextColor(...WHITE);

    autoTable(doc, {
      startY: 54,
      head: [["Situação atual", "Em 90 dias com a O2"]],
      body: input.outcomeRows.map((r) => [r.current, r.future]),
      ...darkTableStyles(10),
      columnStyles: { 0: { cellWidth: 88 }, 1: { cellWidth: 88 } },
    });
  }

  // -- Page 4: Recommendation --
  doc.addPage();
  header(doc, "Recomendação", input.companyName);

  let ry = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text("Serviço recomendado", 14, ry);
  ry += 10;

  highlightValue(doc, input.recommendation.tagline, input.recommendation.service, ry);
  ry += 32;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...LIGHT_GRAY);
  const reasonLines = doc.splitTextToSize(input.recommendation.reason, 170);
  doc.text(reasonLines, 14, ry);
  ry += reasonLines.length * 5 + 10;
  doc.setTextColor(...WHITE);

  if (input.complementary) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...WHITE);
    doc.text("Serviço complementar", 14, ry);
    ry += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...GREEN);
    doc.text(input.complementary.service, 14, ry);
    ry += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    const compLines = doc.splitTextToSize(input.complementary.reason, 170);
    doc.text(compLines, 14, ry);
    ry += compLines.length * 5 + 10;
    doc.setTextColor(...WHITE);
  }

  // -- Notes (if any) --
  if (input.notes?.trim()) {
    if (ry > 220) {
      doc.addPage();
      header(doc, "Observações", input.companyName);
      ry = 40;
    } else {
      ry += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...WHITE);
      doc.text("Observações do consultor", 14, ry);
      ry += 8;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...LIGHT_GRAY);
    const noteLines = doc.splitTextToSize(input.notes, 170);
    doc.text(noteLines, 14, ry);
    ry += noteLines.length * 5 + 10;
    doc.setTextColor(...WHITE);
  }

  // -- Page 5: Next steps --
  doc.addPage();
  header(doc, "Próximos Passos", input.companyName);

  let ny = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text("Como funciona o onboarding O2", 14, ny);
  ny += 14;

  const steps = [
    {
      title: "1. Alinhamento inicial",
      desc: "Reunião de kick-off para entender processos atuais, definir prioridades e mapear acessos necessários.",
    },
    {
      title: "2. Diagnóstico aprofundado",
      desc: "Nos primeiros 15 dias, mergulhamos nos números da empresa para criar um plano de ação personalizado.",
    },
    {
      title: "3. Implantação dos processos",
      desc: "Estruturação de controles, fluxos de aprovação, conciliação e relatórios — tudo adaptado à sua realidade.",
    },
    {
      title: "4. Operação assistida",
      desc: "Acompanhamento semanal com indicadores claros, reuniões de alinhamento e ajustes contínuos.",
    },
    {
      title: "5. Resultados em 90 dias",
      desc: "Ao final do primeiro trimestre, apresentamos um comparativo mostrando a evolução real da gestão financeira.",
    },
  ];

  for (const step of steps) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.text(step.title, 14, ny);
    ny += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...LIGHT_GRAY);
    const lines = doc.splitTextToSize(step.desc, 170);
    doc.text(lines, 14, ny);
    ny += lines.length * 5 + 8;
  }

  ny += 5;
  doc.setFillColor(...DARK_2);
  doc.setDrawColor(...GREEN);
  doc.roundedRect(14, ny, 182, 20, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  doc.text("Pronto para transformar sua gestão financeira?", 20, ny + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Entre em contato com seu consultor O2 para dar o próximo passo.", 20, ny + 15);

  footer(doc);
  doc.save(`O2-Proposta-${input.companyName.replace(/\s+/g, "-")}.pdf`);
}
