import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download, FileText } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportCalculatorPDF } from "@/lib/pdf-export";
import { formatBRL } from "@/lib/format";
import { useCFOPricing, type CFOBaseRule, type CFOComplexityRule, type SetupPricingRule } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LossSummaryPanel } from "@/components/LossSummaryPanel";
import { RoiPanel } from "@/components/RoiPanel";
import { useDiagnosticLoss } from "@/lib/roi";
import { Row } from "@/components/calc-row";
import { InfoTooltip, TOOLTIPS } from "@/components/InfoTooltip";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation, SERVICE_DETAILS } from "@/components/ProductPresentation";
import { DiretoContractGenerator } from "@/components/DiretoContractGenerator";
import { ProposalActions } from "@/components/ProposalActions";
import { proposalService, type ClosingOffer, type ProposalModel } from "@/lib/proposal";
import { calcSetupPriceFromRules, type SegmentType } from "@/lib/pricing-shared";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { BPO_SETUP_DELIVERABLES } from "@/lib/bpo-cronograma";

export const Route = createFileRoute("/calculadora/cfo")({
  component: CalculadoraCFOPage,
});

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "meeting", label: "Condição de fechamento na reunião", percent: 10 },
];

// Piso de tabela da recorrência completa (inclui governança); o desconto incide depois.
const CFO_MINIMUM = 8411;



function lookupCFOBase(rules: CFOBaseRule[], annualRevenue: number): number {
  if (!rules.length) return 0;
  const sorted = [...rules].sort((a, b) => a.sort_order - b.sort_order);
  for (const r of sorted) {
    if (r.max_revenue === null || annualRevenue < Number(r.max_revenue)) return Number(r.base_price);
  }
  return Number(sorted[sorted.length - 1].base_price);
}

function complexityFromRules(rules: CFOComplexityRule[], score: number): { factor: number; label: string } {
  const sorted = [...rules].sort((a, b) => a.min_score - b.min_score);
  for (const r of sorted) {
    if (score >= r.min_score && score <= r.max_score) return { factor: Number(r.factor), label: r.level };
  }
  const last = sorted[sorted.length - 1];
  return last ? { factor: Number(last.factor), label: last.level } : { factor: 1, label: "—" };
}

function CalculadoraCFOPage() {
  const { state } = useDiagnostic();
  const { lossMinMonthly } = useDiagnosticLoss();
  const { data, isLoading, error, refetch } = useCFOPricing();

  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [cnpjCount, setCnpjCount] = useState<number>(1);
  const [segmentType, setSegmentType] = useState<SegmentType>("mesmo");
  const [governanceType, setGovernanceType] = useState<string>("simples");
  const [discountId, setDiscountId] = useState("none");
  const complexity = [2, 2, 2, 2, 2, 2];

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  useEffect(() => {
    if (cnpjCount === 1 && segmentType !== "mesmo") setSegmentType("mesmo");
  }, [cnpjCount, segmentType]);

  const annualRevenue = monthlyRevenue * 12;
  const basePrice = useMemo(() => (data ? lookupCFOBase(data.base, annualRevenue) : 0), [data, annualRevenue]);
  const cnpjMultiplier = useMemo(() => {
    // 1 CNPJ = 1,00; +0,05 por CNPJ adicional; teto em 10 CNPJs (1,45).
    const n = Math.min(Math.max(1, cnpjCount), 10);
    return 1 + (n - 1) * 0.05;
  }, [cnpjCount]);
  const complexityScore = complexity.reduce((s, v) => s + v, 0);
  const cf = data ? complexityFromRules(data.complexity, complexityScore) : { factor: 1, label: "—" };
  const segmentAdj = useMemo(() => {
    if (cnpjCount <= 1 || !data) return 0;
    const r = data.segment.find((s) => s.segment_type === segmentType);
    return r ? Number(r.adjustment) : 0;
  }, [data, cnpjCount, segmentType]);
  const governanceFee = useMemo(() => {
    const r = data?.governance.find((g) => g.governance_type === governanceType);
    return r ? Number(r.fee) : 0;
  }, [data, governanceType]);

  const subtotalRecorrencia = basePrice * cnpjMultiplier * cf.factor;
  const recorrenciaSemDesconto = Math.max(
    CFO_MINIMUM,
    subtotalRecorrencia * (1 + segmentAdj / 100) + governanceFee,
  );

  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const finalRecorrencia = recorrenciaSemDesconto * (1 - discount.percent / 100);

  const setupResult = data
    ? calcSetupPriceFromRules(data.setup as SetupPricingRule[], monthlyRevenue, cnpjCount, segmentType)
    : { classification: "padrao" as const, base: 0, surcharge: 0, total: 0 };

  const setupComDesconto = setupResult.total * (1 - discount.percent / 100);
  const setupParcela = setupComDesconto / 12;
  const totalMensal = finalRecorrencia + setupParcela;
  const [showPrices, setShowPrices] = useState(false);
  const [showDireto, setShowDireto] = useState(false);

  // A proposta ancora no valor de tabela (sem desconto). O desconto selecionado
  // vira a condição especial de fechamento, para o cliente ver o de-para.
  const buildProposalModel = (closing?: ClosingOffer): ProposalModel => ({
    client: {
      name: state.companyName || "Cliente",
      monthlyRevenue,
      cnpjCount,
      profile: `${cf.label} · ${cnpjCount > 1 ? `${cnpjCount} CNPJs` : "CNPJ único"}`,
    },
    services: [
      proposalService("cfo", "CFO as a Service", recorrenciaSemDesconto, {
        notIncluded: SERVICE_DETAILS.cfo.notIncluded,
      }),
    ],
    setup: {
      label: "Estruturação Financeira (Setup inicial)",
      total: setupResult.total,
      installments: 12,
    },
    closing,
  });

  const suggestedClosing: ClosingOffer | undefined =
    discount.percent > 0
      ? { monthly: finalRecorrencia, setupTotal: setupComDesconto, installments: 12 }
      : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "CFO as a Service" }]} />

        <div className="mb-8">
          <h1 className="font-bold tracking-[0.005em]" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>Calculadora — CFO as a Service</h1>
          <p className="text-muted-foreground mt-2">Configure os parâmetros para precificar mensalidade e setup.</p>
        </div>

        <ProductPresentation serviceKey="cfo" title="CFO as a Service" />

        <LossSummaryPanel />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {data && (<>
          <div className="mb-6">
            <CollapsibleSection
              eyebrow="Benefício"
              title="Setup + Oxy + Gênio"
              subtitle="12 parcelas no cartão — incluído no valor mensal"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Setup — o que inclui</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                {BPO_SETUP_DELIVERABLES.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-primary bg-primary/15 shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="rounded-2xl border border-border bg-card p-7">
                <h2 className="text-lg font-semibold mb-4">Parâmetros</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Faturamento mensal</Label>
                    <CurrencyInput value={monthlyRevenue} onValueChange={setMonthlyRevenue} />
                    <p className="text-xs text-muted-foreground">Anual (estimado): {formatBRL(annualRevenue)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Quantidade de CNPJs <InfoTooltip text={TOOLTIPS.cnpj} />
                    </Label>
                    <Input type="number" min={1} max={10} value={cnpjCount}
                      onChange={(e) => setCnpjCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Tipo de segmento <InfoTooltip text={TOOLTIPS.segmento} />
                    </Label>
                    <Select value={segmentType} onValueChange={(v) => setSegmentType(v as SegmentType)} disabled={cnpjCount === 1}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mesmo">Mesmo segmento</SelectItem>
                        <SelectItem value="correlato">Correlato</SelectItem>
                        <SelectItem value="diferente">Diferente</SelectItem>
                        <SelectItem value="muito_diferente">Muito diferente</SelectItem>
                      </SelectContent>
                    </Select>
                    {cnpjCount === 1 && <p className="text-xs text-muted-foreground">Disponível com 2+ CNPJs</p>}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="flex items-center gap-2">
                      Tipo de governança <InfoTooltip text={TOOLTIPS.governanca} />
                    </Label>
                    <Select value={governanceType} onValueChange={setGovernanceType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {data.governance.map((g) => (
                          <SelectItem key={g.governance_type} value={g.governance_type}>
                            {g.governance_type.charAt(0).toUpperCase() + g.governance_type.slice(1)}
                            {Number(g.fee) > 0 ? " (+ taxa)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 rounded-2xl border-2 border-primary bg-card overflow-hidden"
                   style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
                {showPrices ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Tabs defaultValue="recorrencia" className="w-full">
                      <div className="px-5 pt-5">
                        <TabsList className="grid grid-cols-2 w-full">
                          <TabsTrigger value="recorrencia">Recorrência</TabsTrigger>
                          <TabsTrigger value="setup">Setup</TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="recorrencia" className="p-5 space-y-4 mt-0">
                        <Row label="Preço base" value={formatBRL(basePrice)} />
                        <Row label="Multiplicador CNPJ" value={`×${cnpjMultiplier.toFixed(2)} (${cnpjCount})`} />
                        <Row label="Complexidade" value={`${cf.label} ×${cf.factor} (${complexityScore})`} />
                        <Row label="Ajuste segmento" value={cnpjCount > 1 ? `+${segmentAdj}%` : "—"} />
                        <Row label="Taxa governança" value={formatBRL(governanceFee)} />
                        {discount.percent > 0 && (
                          <Row label={`Desconto (${discount.percent}%)`} value={`-${formatBRL(recorrenciaSemDesconto - finalRecorrencia)}`} />
                        )}

                        <div className="mt-3 rounded-xl bg-primary/15 border border-primary p-4">
                          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Valor mensal</p>
                          <p className="text-3xl font-bold text-primary mt-1 tabular-nums">{formatBRL(finalRecorrencia)}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="setup" className="p-5 space-y-4 mt-0">
                        <Row label="Classificação" value={setupResult.classification === "padrao" ? "Padrão" : "Complexo"} />
                        <Row label="Setup base" value={formatBRL(setupResult.base)} />
                        <Row label="Adicional por segmento" value={setupResult.surcharge > 0 ? formatBRL(setupResult.surcharge) : "—"} />
                        <Row label="Valor total setup" value={formatBRL(setupResult.total)} bold />
                        {discount.percent > 0 && (
                          <Row label={`Desconto (${discount.percent}%)`} value={`-${formatBRL(setupResult.total - setupComDesconto)}`} />
                        )}

                        <div className="mt-3 rounded-xl bg-primary/15 border border-primary p-4">
                          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Setup em 12x no cartão</p>
                          <p className="text-3xl font-bold text-primary mt-1 tabular-nums">{formatBRL(setupParcela)}<span className="text-sm font-normal text-primary/70">/mês</span></p>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="px-5 pb-5">
                      <div className="rounded-xl bg-primary/15 border border-primary p-4">
                        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Investimento mensal total</p>
                        <p className="text-3xl font-bold text-primary mt-1 tabular-nums">{formatBRL(totalMensal)}</p>
                        <div className="mt-2 text-xs text-primary/70 space-y-0.5">
                          <p>Recorrência: {formatBRL(finalRecorrencia)} + Setup 12x no cartão: {formatBRL(setupParcela)}</p>
                        </div>
                      </div>
                      <RoiPanel investmentMonthly={totalMensal} />
                      <Button
                        onClick={() =>
                          exportCalculatorPDF({
                            service: "CFO as a Service",
                            clientName: state.companyName,
                            monthlyRevenue,
                            rows: [
                              ["Preço base", formatBRL(basePrice)],
                              ["Multiplicador CNPJ", `×${cnpjMultiplier.toFixed(2)} (${cnpjCount})`],
                              ["Complexidade", `${cf.label} ×${cf.factor} (${complexityScore})`],
                              ["Ajuste segmento", cnpjCount > 1 ? `+${segmentAdj}%` : "—"],
                              ["Taxa governança", formatBRL(governanceFee)],
                              ...(discount.percent > 0
                                ? [[`Desconto (${discount.percent}%)`, `-${formatBRL(recorrenciaSemDesconto - finalRecorrencia)}`] as [string, string]]
                                : []),
                              ["Mensalidade", formatBRL(finalRecorrencia)],
                              ["Setup (12x no cartão)", formatBRL(setupParcela)],
                            ],
                            finalLabel: "Investimento mensal total",
                            finalValue: formatBRL(totalMensal),
                            roi: { lossMinMonthly, investmentMonthly: totalMensal },
                            scope: SERVICE_DETAILS.cfo.deliverables,
                            scopeIntro: SERVICE_DETAILS.cfo.what,
                            stages: [
                              {
                                title: "Setup — o que inclui",
                                description: "Entregáveis da implantação, incluindo parametrização da Oxy e Agente Gênio.",
                                items: BPO_SETUP_DELIVERABLES,
                              },
                              ...(SERVICE_DETAILS.cfo.stages ?? []),
                            ],
                            stagesTitle: "Escopo detalhado — CFO as a Service",
                          })
                        }
                        className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
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
                  </div>
                ) : (
                  <div className="p-5">
                    <Button
                      onClick={() => setShowPrices(true)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Investimento
                    </Button>
                  </div>
                )}
              </div>
            </aside>
          </div>


          <DiretoContractGenerator
            defaultServico="cfo"
            clientName={state.companyName}
            valorSetupReais={Math.round(setupComDesconto)}
            valorMensalReais={Math.round(finalRecorrencia)}
            expanded={showDireto}
            onExpandedChange={setShowDireto}
          />
        </>)}
      </div>

      <MobilePriceSummary label="Investimento mensal total" value={formatBRL(totalMensal)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}


