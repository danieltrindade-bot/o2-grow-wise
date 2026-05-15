import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const formatBRL = (v: number): string =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TODAY = () =>
  new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const PRIMARY: [number, number, number] = [0, 232, 95];
const DARK: [number, number, number] = [17, 17, 17];

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("O2", 14, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(title, 30, 14);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(subtitle, 30, 21);
  }
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(`Gerado em ${TODAY()}`, 196, 14, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`O2 Inc — Página ${i}/${pageCount}`, 105, 290, { align: "center" });
  }
}

function highlightValue(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFillColor(245, 255, 248);
  doc.setDrawColor(...PRIMARY);
  doc.roundedRect(14, y, 182, 22, 3, 3, "FD");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(label.toUpperCase(), 20, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 150, 60);
  doc.text(value, 20, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
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

export function exportCalculatorPDF(input: CalcPDFInput) {
  const doc = new jsPDF();
  header(doc, input.service, "Proposta comercial");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do cliente", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
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
    headStyles: { fillColor: DARK, textColor: PRIMARY },
    styles: { fontSize: 10 },
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

export function exportDiagnosticPDF(input: DiagnosticPDFInput) {
  const doc = new jsPDF();
  header(doc, "Diagnóstico Financeiro", input.companyName);

  doc.setFontSize(10);
  doc.text(`Empresa: ${input.companyName}`, 14, 40);
  doc.text(`Consultor: ${input.consultantName}`, 14, 46);
  doc.text(`Data: ${input.date}`, 14, 52);

  // Score box
  doc.setFillColor(245, 250, 255);
  doc.setDrawColor(200);
  doc.roundedRect(14, 58, 182, 22, 3, 3, "FD");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("NOTA DE MATURIDADE", 20, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(`${input.grade}/10`, 20, 76);
  doc.setFontSize(11);
  doc.text(input.maturityLabel, 60, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(input.maturityDescription, 60, 76);
  doc.setTextColor(0, 0, 0);

  let y = 90;
  if (input.costRows.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Estimativa de perdas mensais", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Gap identificado", "Estimativa mensal"]],
      body: input.costRows.map((r) => [r.label, r.value]),
      foot: input.costTotal ? [["Total estimado", input.costTotal]] : undefined,
      headStyles: { fillColor: DARK, textColor: PRIMARY },
      footStyles: { fillColor: [240, 240, 240], textColor: [200, 0, 0], fontStyle: "bold" },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (input.outcomeRows.length) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("O que muda em 90 dias", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Situação atual", "Em 90 dias com a O2"]],
      body: input.outcomeRows.map((r) => [r.current, r.future]),
      headStyles: { fillColor: DARK, textColor: PRIMARY },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recomendação", 14, y);
  highlightValue(doc, input.recommendation.tagline, input.recommendation.service, y + 4);

  footer(doc);
  doc.save(`O2-Diagnostico-${input.companyName.replace(/\s+/g, "-")}.pdf`);
}
