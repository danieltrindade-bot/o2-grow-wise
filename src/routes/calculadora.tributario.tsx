import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, CreditCard, Download } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatBRL } from "@/lib/pricing-shared";
import { useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Row } from "@/components/calc-row";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { exportCalculatorPDF } from "@/lib/pdf-export";

export const Route = createFileRoute("/calculadora/tributario")({
  component: TributarioPage,
});

type Modalidade = "completo" | "diagnostico";

const MODALIDADE_LABELS: Record<Modalidade, string> = {
  completo: "Diagnóstico + Organização Tributária",
  diagnostico: "Apenas Diagnóstico Tributário",
};

const FAIXAS = [
  { min: 0, max: 200_000, mensal: 2500 },
  { min: 200_000, max: 500_000, mensal: 3000 },
  { min: 500_000, max: 1_000_000, mensal: 3800 },
  { min: 1_000_000, max: 2_500_000, mensal: 4500 },
  { min: 2_500_000, max: Infinity, mensal: 5500 },
];

const CNPJ_ADICIONAL = 500;

function getMensal(revenue: number): number {
  const faixa = FAIXAS.find((f) => revenue <= f.max) ?? FAIXAS[FAIXAS.length - 1];
  return faixa.mensal;
}

function getFaixaLabel(revenue: number): string {
  if (revenue <= 200_000) return "Até R$ 200k";
  if (revenue <= 500_000) return "R$ 200k a R$ 500k";
  if (revenue <= 1_000_000) return "R$ 500k a R$ 1M";
  if (revenue <= 2_500_000) return "R$ 1M a R$ 2,5M";
  return "Acima de R$ 2,5M";
}

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "d7", label: "Pagamento em 7 dias", percent: 7 },
  { id: "meeting", label: "Fechamento em reunião", percent: 15 },
];

const INCLUDES_COMPLETO = [
  "Diagnóstico tributário completo (atual vs. CBS/IBS)",
  "Simulação de impacto nas margens por produto/serviço",
  "Revisão e correção cadastral (NCM/NBS) no ERP",
  "Revisão de contratos com cláusulas de reequilíbrio",
  "Adequação da precificação ao novo modelo",
  "Análise de impacto do split payment no fluxo de caixa",
  "Avaliação do regime tributário ideal",
  "Plano de transição com roadmap 2026-2027",
  "Workshop de capacitação da equipe fiscal/financeira",
  "Relatório final com recomendações e plano de ação",
];

const INCLUDES_DIAGNOSTICO = [
  "Diagnóstico tributário completo (atual vs. CBS/IBS)",
  "Simulação de impacto nas margens por produto/serviço",
  "Avaliação do regime tributário ideal",
  "Análise de impacto do split payment no fluxo de caixa",
  "Relatório final com recomendações e plano de ação",
];

function TributarioPage() {
  const { state } = useDiagnostic();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [cnpjCount, setCnpjCount] = useState(1);
  const [modalidade, setModalidade] = useState<Modalidade>("completo");
  const [discountId, setDiscountId] = useState("none");
  const [showPrices, setShowPrices] = useState(false);

  const baseMensal = getMensal(monthlyRevenue);
  const adicionalCnpj = (cnpjCount - 1) * CNPJ_ADICIONAL;
  const mensalBruto = baseMensal + adicionalCnpj;
  const fator = modalidade === "diagnostico" ? 0.7 : 1;
  const mensal = mensalBruto * fator;
  const total6m = mensal * 6;
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const total6mComDesconto = total6m * (1 - discount.percent / 100);
  const parcela12x = total6mComDesconto / 12;
  const animatedParcela = useCountUp(parcela12x);
  const includes = modalidade === "completo" ? INCLUDES_COMPLETO : INCLUDES_DIAGNOSTICO;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "Diagnóstico Tributário" }]} />
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Diagnóstico e Organização Tributária</h1>
          <p className="text-muted-foreground mt-2">Adequação à Reforma Tributária (EC 132/2023 + LC 214/2025)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Parâmetros</h2>
              <div className="space-y-2">
                <Label>Faturamento mensal</Label>
                <CurrencyInput value={monthlyRevenue} onValueChange={setMonthlyRevenue} />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de CNPJs</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={cnpjCount}
                  onChange={(e) => setCnpjCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                />
                {cnpjCount > 1 && (
                  <p className="text-xs text-muted-foreground">+R$ 500/mês por CNPJ adicional</p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Faixa identificada</p>
                <p className="text-lg font-semibold text-primary">{getFaixaLabel(monthlyRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">Contrato de 6 meses | 12x no cartão</p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h2 className="text-lg font-semibold">Modalidade</h2>
              {(["completo", "diagnostico"] as Modalidade[]).map((m) => {
                const selected = modalidade === m;
                return (
                  <label
                    key={m}
                    className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors ${
                      selected ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tributario-modalidade"
                        value={m}
                        checked={selected}
                        onChange={() => setModalidade(m)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm">{MODALIDADE_LABELS[m]}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{m === "completo" ? "100%" : "70%"}</span>
                  </label>
                );
              })}
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h2 className="text-lg font-semibold">Desconto</h2>
              {DISCOUNTS.map((d) => {
                const selected = discountId === d.id;
                return (
                  <label
                    key={d.id}
                    className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors ${
                      selected ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tributario-discount"
                        value={d.id}
                        checked={selected}
                        onChange={() => setDiscountId(d.id)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm">{d.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{d.percent}%</span>
                  </label>
                );
              })}
            </section>
          </div>

          <aside className="rounded-2xl border-2 border-primary bg-card p-6"
                 style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
            <p className="text-xs uppercase tracking-wider text-primary">Investimento</p>
            {showPrices ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Row label="Modalidade" value={MODALIDADE_LABELS[modalidade]} />
                <Row label="Faixa" value={getFaixaLabel(monthlyRevenue)} />
                <Row label="Valor mensal base" value={formatBRL(baseMensal)} />
                {adicionalCnpj > 0 && (
                  <Row label={`Adicional ${cnpjCount - 1} CNPJ(s)`} value={formatBRL(adicionalCnpj)} />
                )}
                {modalidade === "diagnostico" && (
                  <Row label="Fator diagnóstico (70%)" value={`-${formatBRL(mensalBruto * 0.3)}`} />
                )}
                <Row label="Mensal" value={formatBRL(mensal)} bold />
                <Row label="Total (6 meses)" value={formatBRL(total6m)} />
                {discount.percent > 0 && (
                  <Row label={`Desconto (${discount.percent}%)`} value={`-${formatBRL(total6m - total6mComDesconto)}`} />
                )}

                <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                  <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider">
                    <CreditCard className="h-4 w-4" /> 12x no cartão de crédito
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                    {formatBRL(animatedParcela)}<span className="text-sm font-normal text-primary/70">/mês</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {formatBRL(total6mComDesconto)} em 12x
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Inclui</p>
                  <ul className="space-y-1.5">
                    {includes.map((i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() =>
                    exportCalculatorPDF({
                      service: `Diagnóstico Tributário — ${MODALIDADE_LABELS[modalidade]}`,
                      clientName: state.companyName,
                      monthlyRevenue,
                      rows: [
                        ["Modalidade", MODALIDADE_LABELS[modalidade]],
                        ["Faixa", getFaixaLabel(monthlyRevenue)],
                        ["CNPJs", String(cnpjCount)],
                        ["Mensal", formatBRL(mensal)],
                        ["Total (6 meses)", formatBRL(total6mComDesconto)],
                        ...(discount.percent > 0 ? [["Desconto", `${discount.percent}% — ${discount.label}`] as [string, string]] : []),
                      ],
                      finalLabel: "12x no cartão",
                      finalValue: formatBRL(parcela12x),
                      scope: modalidade === "completo" ? INCLUDES_COMPLETO : INCLUDES_DIAGNOSTICO,
                    })
                  }
                  className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="mr-2 h-4 w-4" /> Exportar PDF
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <Row label="Modalidade" value={MODALIDADE_LABELS[modalidade]} />
                <Row label="Faixa" value={getFaixaLabel(monthlyRevenue)} />
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Inclui</p>
                  <ul className="space-y-1.5">
                    {includes.map((i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={() => setShowPrices(true)}
                  className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Investimento
                </Button>
              </div>
            )}
          </aside>
        </div>
      </div>

      <MobilePriceSummary label="12x de" value={formatBRL(parcela12x)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}
