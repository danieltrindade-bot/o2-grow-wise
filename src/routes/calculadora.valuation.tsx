import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download, FileText } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatBRL } from "@/lib/pricing-shared";
import { LucroRealPanel } from "@/components/LucroRealPanel";
import { useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LossSummaryPanel } from "@/components/LossSummaryPanel";
import { Row } from "@/components/calc-row";
import { InfoTooltip, TOOLTIPS } from "@/components/InfoTooltip";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation, SERVICE_DETAILS } from "@/components/ProductPresentation";
import { DiretoContractGenerator } from "@/components/DiretoContractGenerator";
import { exportCalculatorPDF } from "@/lib/pdf-export";
import { calcValuation, VALUATION_CNPJ_ADDITIONAL, VALUATION_FLOOR } from "@/lib/valuation-pricing";

export const Route = createFileRoute("/calculadora/valuation")({
  component: ValuationPage,
});

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "meeting", label: "Condição de fechamento na reunião", percent: 15 },
];

const INCLUDES = [
  "Análise dos relatórios contábeis (DRE, Balanço, Fluxo de Caixa)",
  "Estudo de mercado, benchmarks e pares",
  "Modelagem financeira por DCF e Múltiplos",
  "Avaliação patrimonial contábil e gerencial",
  "Laudo técnico de Valuation em até 60 dias",
];

// Formas de pagamento — cobrança única.
const CARTAO_PARCELAS = 12; // 12x no cartão
const BOLETO_PARCELAS = 4; // 1 + 3 no boleto/pix (entrada + 3)

function ValuationPage() {
  const { state } = useDiagnostic();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [cnpjCount, setCnpjCount] = useState(1);
  const [discountId, setDiscountId] = useState("none");
  const [showPrices, setShowPrices] = useState(false);
  const [showDireto, setShowDireto] = useState(false);

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const quote = calcValuation(monthlyRevenue, cnpjCount, discount.percent);
  const valorFinal = quote.total;
  const animatedFinal = useCountUp(valorFinal);

  const parcelaCartao = valorFinal / CARTAO_PARCELAS;
  const parcelaBoleto = valorFinal / BOLETO_PARCELAS;
  const cnpjLabel =
    quote.extraCnpjs > 0
      ? `+${formatBRL(quote.cnpjAdjustment)} (${quote.extraCnpjs} ${quote.extraCnpjs > 1 ? "adicionais" : "adicional"})`
      : "—";

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "Valuation" }]} />

        <div className="mb-6">
          <ProductPresentation serviceKey="valuation" title="Valuation" />
        </div>

        <LossSummaryPanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Parâmetros</h2>
              <div className="space-y-2">
                <Label>Faturamento mensal</Label>
                <CurrencyInput value={monthlyRevenue} onValueChange={setMonthlyRevenue} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Quantidade de CNPJs <InfoTooltip text={TOOLTIPS.cnpj} />
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={cnpjCount}
                  onChange={(e) => setCnpjCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                />
                <p className="text-xs text-muted-foreground">
                  Até 2 CNPJs inclusos. +{formatBRL(VALUATION_CNPJ_ADDITIONAL)} por CNPJ a partir do 3º.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <button
                type="button"
                onClick={() => setDiscountId(discountId === "meeting" ? "none" : "meeting")}
                className={cn("flex w-full items-center gap-3 rounded-xl border bg-background p-3 cursor-pointer text-left",
                  discountId === "meeting" ? "border-primary bg-primary/10" : "border-border")}>
                <span className={cn("h-4 w-4 rounded-full border-2 shrink-0",
                  discountId === "meeting" ? "border-primary bg-primary" : "border-muted-foreground")} />
                <span className="text-sm">Condição de fechamento na reunião</span>
              </button>
            </section>
          </div>

          <aside className="rounded-2xl border-2 border-primary bg-card p-6"
                 style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
            <p className="text-xs uppercase tracking-wider text-primary">Investimento único</p>
            {showPrices ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Row label="Faixa de faturamento" value={quote.tier.label} />
                <Row label="Preço base" value={formatBRL(quote.tier.price)} />
                <Row label="Ajuste CNPJs" value={cnpjLabel} />
                {discount.percent > 0 && (
                  <Row label={`Desconto (${discount.percent}%)`} value={`-${formatBRL(quote.discountValue)}`} />
                )}
                {quote.atFloor && discount.percent > 0 && (
                  <Row label="Piso aplicado" value={formatBRL(VALUATION_FLOOR)} />
                )}

                <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                  <p className="text-xs uppercase tracking-wider text-primary">Valor total</p>
                  <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                    {formatBRL(animatedFinal)}
                  </p>
                </div>
                <LucroRealPanel lines={[{ label: "Valor total", value: valorFinal }]} />

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary">Cartão de crédito</p>
                    <p className="text-xl font-bold tabular-nums mt-1">
                      12x de {formatBRL(parcelaCartao)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total {formatBRL(valorFinal)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary">Boleto / Pix (1 + 3)</p>
                    <p className="text-xl font-bold tabular-nums mt-1">
                      4x de {formatBRL(parcelaBoleto)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Entrada + 3 parcelas · Total {formatBRL(valorFinal)}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Inclui</p>
                  <ul className="space-y-1.5">
                    {INCLUDES.map((i) => (
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
                      service: "Valuation",
                      clientName: state.companyName,
                      monthlyRevenue,
                      rows: [
                        ["Faixa de faturamento", quote.tier.label],
                        ["Preço base", formatBRL(quote.tier.price)],
                        ["CNPJs", String(cnpjCount)],
                        ["Ajuste CNPJ", formatBRL(quote.cnpjAdjustment)],
                        ...(discount.percent > 0
                          ? [["Desconto (" + discount.percent + "%)", "-" + formatBRL(quote.discountValue)] as [string, string]]
                          : []),
                        ...(quote.atFloor && discount.percent > 0
                          ? [["Piso aplicado", formatBRL(VALUATION_FLOOR)] as [string, string]]
                          : []),
                        ["Cartão", "12x de " + formatBRL(parcelaCartao)],
                        ["Boleto / Pix (1+3)", "4x de " + formatBRL(parcelaBoleto)],
                        ["Prazo de entrega", "Até 60 dias"],
                      ],
                      finalLabel: "Valor total",
                      finalValue: formatBRL(valorFinal),
                      scope: SERVICE_DETAILS.valuation.deliverables,
                      scopeIntro: SERVICE_DETAILS.valuation.what,
                      stages: SERVICE_DETAILS.valuation.stages,
                      stagesTitle: "Detalhamento do escopo — Valuation (até 60 dias)",
                    })
                  }
                  className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="mr-2 h-4 w-4" /> Exportar PDF
                </Button>
                <Button
                  onClick={() => setShowDireto(!showDireto)}
                  className="w-full mt-3 bg-card border border-border text-foreground hover:border-primary/60"
                  variant="outline"
                >
                  <FileText className="mr-2 h-4 w-4" /> Gerar Contrato
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <Row label="Faixa de faturamento" value={quote.tier.label} />
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Inclui</p>
                  <ul className="space-y-1.5">
                    {INCLUDES.map((i) => (
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
                  Ver investimento
                </Button>
              </div>
            )}
          </aside>
        </div>

        <DiretoContractGenerator
          defaultServico="valuation"
          clientName={state.companyName}
          valorSetupReais={0}
          valorMensalReais={Math.round(valorFinal)}
          expanded={showDireto}
          onExpandedChange={setShowDireto}
        />
      </div>

      <MobilePriceSummary label="Valor total" value={formatBRL(valorFinal)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}
