import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download, FileText } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatBRL } from "@/lib/pricing-shared";
import { useEstrategicoPricing, type EstrategicoRule } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState, useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LossSummaryPanel } from "@/components/LossSummaryPanel";
import { Row } from "@/components/calc-row";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation, SERVICE_DETAILS } from "@/components/ProductPresentation";
import { DiretoContractGenerator } from "@/components/DiretoContractGenerator";
import { exportCalculatorPDF } from "@/lib/pdf-export";

export const Route = createFileRoute("/calculadora/estrategico")({
  component: EstrategicoPage,
});

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "meeting", label: "Condição de fechamento na reunião", percent: 15 },
];

const INCLUDES = [
  "Diagnóstico estratégico aprofundado do negócio",
  "Análise de maturidade e posicionamento",
  "Plano de ação com prioridades e próximos passos",
];

// Formas de pagamento — cobrança única.
const CARTAO_PARCELAS = 12; // 12x no cartão
const BOLETO_PARCELAS = 4; // 1 + 3 no boleto/pix (entrada + 3)

function lookupTier(rules: EstrategicoRule[], monthlyRevenue: number): EstrategicoRule | null {
  if (!rules.length) return null;
  const sorted = [...rules].sort((a, b) => a.sort_order - b.sort_order);
  for (const r of sorted) {
    if (r.max_revenue === null || monthlyRevenue < Number(r.max_revenue)) return r;
  }
  return sorted[sorted.length - 1];
}

function EstrategicoPage() {
  const { state } = useDiagnostic();
  const { data, isLoading, error, refetch } = useEstrategicoPricing();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [discountId, setDiscountId] = useState("none");
  const [showPrices, setShowPrices] = useState(false);
  const [showDireto, setShowDireto] = useState(false);

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  const tier = useMemo(
    () => (data ? lookupTier(data.rules, monthlyRevenue) : null),
    [data, monthlyRevenue],
  );

  const floor = Number(data?.settings.min_price ?? 12000);
  const baseP = Number(tier?.base_price ?? 0);
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  // Piso absoluto: nunca abaixo de R$ 12.000, mesmo com o desconto máximo (15%).
  const valorFinal = baseP > 0 ? Math.max(floor, baseP * (1 - discount.percent / 100)) : 0;
  const animatedFinal = useCountUp(valorFinal);

  const parcelaCartao = valorFinal / CARTAO_PARCELAS;
  const parcelaBoleto = valorFinal / BOLETO_PARCELAS;
  const atPiso = baseP > 0 && valorFinal === floor;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "Diagnóstico Estratégico" }]} />
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Diagnóstico Estratégico</h1>
        </div>

        <div className="mb-6">
          <ProductPresentation serviceKey="estrategico" title="Diagnóstico Estratégico" />
        </div>

        <LossSummaryPanel />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {data && (<>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold">Parâmetros</h2>
                <div className="space-y-2">
                  <Label>Faturamento mensal</Label>
                  <CurrencyInput value={monthlyRevenue} onValueChange={setMonthlyRevenue} />
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
                  <Row label="Faixa de faturamento" value={tier?.label ?? "—"} />
                  <Row label="Preço base" value={formatBRL(baseP)} />
                  {discount.percent > 0 && (
                    <Row label={`Desconto (${discount.percent}%)`} value={`-${formatBRL(baseP - baseP * (1 - discount.percent / 100))}`} />
                  )}
                  {atPiso && discount.percent > 0 && (
                    <Row label="Piso aplicado" value={formatBRL(floor)} />
                  )}

                  <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                    <p className="text-xs uppercase tracking-wider text-primary">Valor total</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                      {formatBRL(animatedFinal)}
                    </p>
                  </div>

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
                        service: "Diagnóstico Estratégico",
                        clientName: state.companyName,
                        monthlyRevenue,
                        rows: [
                          ["Faixa de faturamento", tier?.label ?? "—"],
                          ["Preço base", formatBRL(baseP)],
                          ...(discount.percent > 0
                            ? [["Desconto (" + discount.percent + "%)", "-" + formatBRL(baseP - baseP * (1 - discount.percent / 100))] as [string, string]]
                            : []),
                          ...(atPiso && discount.percent > 0
                            ? [["Piso aplicado", formatBRL(floor)] as [string, string]]
                            : []),
                          ["Cartão", "12x de " + formatBRL(parcelaCartao)],
                          ["Boleto / Pix (1+3)", "4x de " + formatBRL(parcelaBoleto)],
                        ],
                        finalLabel: "Valor total",
                        finalValue: formatBRL(valorFinal),
                        scope: SERVICE_DETAILS.estrategico.deliverables,
                        scopeIntro: SERVICE_DETAILS.estrategico.what,
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
                  <Row label="Faixa de faturamento" value={tier?.label ?? "—"} />
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
            defaultServico="diagnostico"
            clientName={state.companyName}
            valorSetupReais={0}
            valorMensalReais={Math.round(valorFinal)}
            expanded={showDireto}
            onExpandedChange={setShowDireto}
          />
        </>)}
      </div>

      <MobilePriceSummary label="Valor total" value={formatBRL(valorFinal)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}
