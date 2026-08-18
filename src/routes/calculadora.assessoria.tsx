import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download, FileText } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatBRL } from "@/lib/pricing-shared";
import { useAssessoriaPricing, type AssessoriaRule } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState, useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LossSummaryPanel } from "@/components/LossSummaryPanel";
import { RoiPanel } from "@/components/RoiPanel";
import { useDiagnosticLoss } from "@/lib/roi";
import { Row } from "@/components/calc-row";
import { InfoTooltip, TOOLTIPS } from "@/components/InfoTooltip";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation, SERVICE_DETAILS } from "@/components/ProductPresentation";
import { exportCalculatorPDF } from "@/lib/pdf-export";
import { DiretoContractGenerator } from "@/components/DiretoContractGenerator";

export const Route = createFileRoute("/calculadora/assessoria")({
  component: AssessoriaPage,
});

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "meeting", label: "Condição de fechamento na reunião", percent: 15 },
];

const INCLUDES = [
  "Jornada de maturidade financeira",
  "Acompanhamento personalizado",
  "Diagnóstico estratégico aprofundado",
];

function lookupTier(rules: AssessoriaRule[], monthlyRevenue: number): AssessoriaRule | null {
  if (!rules.length) return null;
  const sorted = [...rules].sort((a, b) => a.sort_order - b.sort_order);
  for (const r of sorted) {
    if (r.max_revenue === null || monthlyRevenue < Number(r.max_revenue)) return r;
  }
  return sorted[sorted.length - 1];
}

function AssessoriaPage() {
  const { state } = useDiagnostic();
  const { lossMinMonthly } = useDiagnosticLoss();
  const { data, isLoading, error, refetch } = useAssessoriaPricing();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [cnpjCount, setCnpjCount] = useState(1);
  const [discountId, setDiscountId] = useState("none");

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  const tier = useMemo(
    () => (data ? lookupTier(data.rules, monthlyRevenue) : null),
    [data, monthlyRevenue],
  );

  const ajusteCnpj = Math.floor((cnpjCount - 1) / 2) * (data?.settings.cnpj_adjustment ?? 0);
  const minP = Number(data?.settings.min_price ?? 0);
  const maxP = Number(data?.settings.max_price ?? Infinity);
  const baseP = Number(tier?.base_price ?? 0);
  const valorMensal = Math.min(maxP, Math.max(minP, baseP + ajusteCnpj));
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const ASSESSORIA_MINIMUM = 4000;
  const valorFinal = Math.max(ASSESSORIA_MINIMUM, valorMensal * (1 - discount.percent / 100));
  const animatedFinal = useCountUp(valorFinal);
  const [showPrices, setShowPrices] = useState(false);
  const [showDireto, setShowDireto] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/servicos"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs
          items={[{ label: "Serviços", to: "/servicos" }, { label: "Assessoria Estratégica" }]}
        />
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Assessoria Estratégica</h1>
        </div>

        <ProductPresentation serviceKey="assessoria" title="Assessoria Estratégica" />

        <LossSummaryPanel />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {data && (
          <>
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
                      onChange={(e) =>
                        setCnpjCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
                      }
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6">
                  <button
                    type="button"
                    onClick={() => setDiscountId(discountId === "meeting" ? "none" : "meeting")}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border bg-background p-3 cursor-pointer text-left",
                      discountId === "meeting" ? "border-primary bg-primary/10" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full border-2 shrink-0",
                        discountId === "meeting"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground",
                      )}
                    />
                    <span className="text-sm">Condição de fechamento na reunião</span>
                  </button>
                </section>
              </div>

              <aside
                className="rounded-2xl border-2 border-primary bg-card p-6"
                style={{
                  backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))",
                }}
              >
                <p className="text-xs uppercase tracking-wider text-primary">Investimento mensal</p>
                {showPrices ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Row label="Faixa de faturamento" value={tier?.label ?? "—"} />
                    <Row label="Preço base" value={formatBRL(baseP)} />
                    <Row
                      label="Ajuste CNPJs"
                      value={
                        cnpjCount > 1
                          ? `+${formatBRL(ajusteCnpj)} (${cnpjCount - 1} adicional${cnpjCount - 1 > 1 ? "is" : ""})`
                          : "—"
                      }
                    />
                    <Row label="Subtotal mensal" value={formatBRL(valorMensal)} />
                    {discount.percent > 0 && (
                      <Row
                        label={`Desconto (${discount.percent}%)`}
                        value={`-${formatBRL(valorMensal - valorFinal)}`}
                      />
                    )}

                    <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                      <p className="text-xs uppercase tracking-wider text-primary">Valor mensal</p>
                      <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                        {formatBRL(animatedFinal)}
                      </p>
                    </div>

                    <RoiPanel investmentMonthly={valorFinal} />

                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Inclui
                      </p>
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
                          service: "Assessoria Estratégica",
                          clientName: state.companyName,
                          monthlyRevenue,
                          rows: [
                            ["Faixa", tier?.label ?? "—"],
                            ["Preço base", formatBRL(baseP)],
                            ["CNPJs", String(cnpjCount)],
                            ["Ajuste CNPJ", formatBRL(ajusteCnpj)],
                            ["Subtotal", formatBRL(valorMensal)],
                            ...(discount.percent > 0
                              ? [
                                  [
                                    "Desconto (" + discount.percent + "%)",
                                    "-" + formatBRL(valorMensal - valorFinal),
                                  ] as [string, string],
                                ]
                              : []),
                          ],
                          finalLabel: "Valor mensal",
                          finalValue: formatBRL(valorFinal),
                          roi: { lossMinMonthly, investmentMonthly: valorFinal },
                          scope: SERVICE_DETAILS.assessoria.deliverables,
                          scopeIntro: SERVICE_DETAILS.assessoria.what,
                          stages: SERVICE_DETAILS.assessoria.stages,
                          stagesTitle: "Jornada de Maturidade — 5 estágios de evolução",
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
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Inclui
                      </p>
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
                      Investimento
                    </Button>
                  </div>
                )}
              </aside>
            </div>

            <DiretoContractGenerator
              defaultServico="assessoria"
              clientName={state.companyName}
              valorSetupReais={0}
              valorMensalReais={Math.round(valorFinal)}
              expanded={showDireto}
              onExpandedChange={setShowDireto}
            />
          </>
        )}
      </div>

      <MobilePriceSummary
        label="Valor mensal"
        value={formatBRL(valorFinal)}
        visible={showPrices}
        onReveal={() => setShowPrices(true)}
      />
    </div>
  );
}
