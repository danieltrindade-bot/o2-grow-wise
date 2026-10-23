import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download, FileText } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { calcSetupPriceFromRules, formatBRL, type SegmentType } from "@/lib/pricing-shared";
import { useAssessoriaPricing, useSetupPricing, type AssessoriaRule } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState, useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LossSummaryPanel } from "@/components/LossSummaryPanel";
import { RoiPanel } from "@/components/RoiPanel";
import { LucroRealPanel } from "@/components/LucroRealPanel";
import { useDiagnosticLoss } from "@/lib/roi";
import { Row } from "@/components/calc-row";
import { InfoTooltip, TOOLTIPS } from "@/components/InfoTooltip";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation, SERVICE_DETAILS } from "@/components/ProductPresentation";
import { exportCalculatorPDF } from "@/lib/pdf-export";
import { DiretoContractGenerator } from "@/components/DiretoContractGenerator";
import { ProposalActions } from "@/components/ProposalActions";
import { DiscountOptions } from "@/components/DiscountOptions";
import { proposalService, type ClosingOffer, type ProposalModel } from "@/lib/proposal";
import { BPO_SETUP_DELIVERABLES } from "@/lib/bpo-cronograma";

export const Route = createFileRoute("/calculadora/assessoria")({
  component: AssessoriaPage,
});

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "meeting", label: "Condição de fechamento na reunião", percent: 10 },
  { id: "forca", label: "Força Empresário!", percent: 18 },
];

const INCLUDES = [
  ...(SERVICE_DETAILS.assessoria.pillars ?? []).map((p) => `${p.title}: ${p.subtitle}`),
  "Setup: estruturação financeira em 12x no cartão",
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
  const { data: setupRules } = useSetupPricing();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [cnpjCount, setCnpjCount] = useState(1);
  const [segmentType, setSegmentType] = useState<SegmentType>("mesmo");
  const [discountId, setDiscountId] = useState("none");

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  useEffect(() => {
    if (cnpjCount === 1 && segmentType !== "mesmo") setSegmentType("mesmo");
  }, [cnpjCount, segmentType]);

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
  // Piso absoluto da mensalidade, mesmo com desconto.
  const ASSESSORIA_MINIMUM = 4000;
  const valorFinal = Math.max(ASSESSORIA_MINIMUM, valorMensal * (1 - discount.percent / 100));

  const setupResult = setupRules
    ? calcSetupPriceFromRules(setupRules, monthlyRevenue, cnpjCount, segmentType)
    : { classification: "padrao" as const, base: 0, surcharge: 0, total: 0 };
  // Piso do setup, mesmo com desconto: 10.000 (12x 833,33 no cartão).
  const ASSESSORIA_SETUP_MINIMUM = 10000;
  const setupComDesconto = Math.max(
    ASSESSORIA_SETUP_MINIMUM,
    setupResult.total * (1 - discount.percent / 100),
  );
  const setupParcela = setupComDesconto / 12;
  const totalMensal = valorFinal + setupParcela;
  const animatedTotal = useCountUp(totalMensal);
  const [showPrices, setShowPrices] = useState(false);
  const [showDireto, setShowDireto] = useState(false);

  const buildProposalModel = (closing?: ClosingOffer): ProposalModel => ({
    client: { name: state.companyName || "Cliente", monthlyRevenue, cnpjCount },
    services: [
      proposalService("assessoria", "Assessoria Estratégica", valorMensal, {
        notIncluded: SERVICE_DETAILS.assessoria.notIncluded,
      }),
    ],
    setup: {
      label: "Estruturação Financeira (Setup inicial)",
      total: setupResult.total,
      installments: 12,
      deliverables: BPO_SETUP_DELIVERABLES,
    },
    closing,
  });

  const suggestedClosing: ClosingOffer | undefined =
    discount.percent > 0 ? { monthly: valorFinal, setupTotal: setupComDesconto, installments: 12 } : undefined;

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
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Tipo de segmento <InfoTooltip text={TOOLTIPS.segmento} />
                    </Label>
                    <Select
                      value={segmentType}
                      onValueChange={(v) => setSegmentType(v as SegmentType)}
                      disabled={cnpjCount === 1}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mesmo">Mesmo segmento</SelectItem>
                        <SelectItem value="correlato">Correlato</SelectItem>
                        <SelectItem value="diferente">Diferente</SelectItem>
                        <SelectItem value="muito_diferente">Muito diferente</SelectItem>
                      </SelectContent>
                    </Select>
                    {cnpjCount === 1 && (
                      <p className="text-xs text-muted-foreground">Disponível com 2+ CNPJs</p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6">
                  <DiscountOptions options={DISCOUNTS} value={discountId} onChange={setDiscountId} />
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
                    <div className="mt-3 rounded-xl bg-primary/15 border border-primary p-5">
                      <p className="text-xs uppercase tracking-wider text-primary">
                        Valor mensal + setup
                      </p>
                      <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                        {formatBRL(animatedTotal)}
                      </p>
                      <p className="mt-2 text-xs text-primary/70">
                        Mensalidade {formatBRL(valorFinal)} + setup 12x no cartão{" "}
                        {formatBRL(setupParcela)}
                      </p>
                    </div>

                    <p className="mt-6 text-xs uppercase tracking-wider text-primary">Mensalidade</p>
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
                    <Row label="Valor mensal" value={formatBRL(valorFinal)} bold />

                    <p className="mt-6 text-xs uppercase tracking-wider text-primary">Setup</p>
                    <Row
                      label="Classificação"
                      value={setupResult.classification === "padrao" ? "Padrão" : "Complexo"}
                    />
                    <Row label="Setup base" value={formatBRL(setupResult.base)} />
                    <Row
                      label="Adicional por segmento"
                      value={setupResult.surcharge > 0 ? formatBRL(setupResult.surcharge) : "—"}
                    />
                    <Row label="Valor total setup" value={formatBRL(setupResult.total)} />
                    {setupComDesconto < setupResult.total && (
                      <Row
                        label={`Desconto (${discount.percent}%)`}
                        value={`-${formatBRL(setupResult.total - setupComDesconto)}`}
                      />
                    )}
                    <Row label="Setup em 12x no cartão" value={`${formatBRL(setupParcela)}/mês`} bold />

                    <RoiPanel investmentMonthly={totalMensal} />
                    <LucroRealPanel
                      items={[
                        { label: "Mensalidade", value: valorFinal },
                        { label: "Setup 12x", value: setupParcela },
                      ]}
                      suffix="/mês"
                    />

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
                            ["Mensalidade", formatBRL(valorFinal)],
                            ["Setup (12x no cartão)", formatBRL(setupParcela)],
                          ],
                          finalLabel: "Investimento mensal total",
                          finalValue: formatBRL(totalMensal),
                          roi: { lossMinMonthly, investmentMonthly: totalMensal },
                          scope: SERVICE_DETAILS.assessoria.deliverables,
                          scopeIntro: SERVICE_DETAILS.assessoria.what,
                          stages: [
                            {
                              title: "Setup — o que inclui",
                              description: "Entregáveis da implantação, incluindo parametrização da Oxy e Agente Gênio.",
                              items: BPO_SETUP_DELIVERABLES,
                            },
                            ...(SERVICE_DETAILS.assessoria.stages ?? []),
                          ],
                          stagesTitle: "Escopo detalhado — Assessoria Estratégica",
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
                    <ProposalActions
                      buildModel={buildProposalModel}
                      suggestedClosing={suggestedClosing}
                      suggestionLabel={discount.label}
                    />
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
              valorSetupReais={Math.round(setupComDesconto)}
              valorMensalReais={Math.round(valorFinal)}
              expanded={showDireto}
              onExpandedChange={setShowDireto}
            />
          </>
        )}
      </div>

      <MobilePriceSummary
        label="Valor mensal + setup"
        value={formatBRL(totalMensal)}
        visible={showPrices}
        onReveal={() => setShowPrices(true)}
      />
    </div>
  );
}
