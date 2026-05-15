import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportCalculatorPDF } from "@/lib/pdf-export";
import { useCFOPricing, type CFOBaseRule, type CFOComplexityRule, type SetupPricingRule } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState, useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InfoTooltip, TOOLTIPS } from "@/components/InfoTooltip";
import { calcSetupPriceFromRules, type SegmentType } from "@/lib/pricing-shared";

export const Route = createFileRoute("/calculadora/cfo")({
  component: CalculadoraCFOPage,
});

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const COMPLEXITY_LABELS = ["Segmento", "Operação", "ERP", "Governança", "Estrutura Societária", "Consolidação"];

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
  const { data, isLoading, error, refetch } = useCFOPricing();

  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [cnpjCount, setCnpjCount] = useState<number>(1);
  const [segmentType, setSegmentType] = useState<SegmentType>("mesmo");
  const [governanceType, setGovernanceType] = useState<string>("simples");
  const [complexity, setComplexity] = useState<number[]>([2, 2, 2, 2, 2, 2]);

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
    const r = data?.cnpj.find((c) => c.cnpj_count === Math.max(1, Math.min(10, cnpjCount)));
    return r ? Number(r.multiplier) : 1;
  }, [data, cnpjCount]);
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
  const finalRecorrencia = subtotalRecorrencia * (1 + segmentAdj / 100) + governanceFee;

  const setupResult = data
    ? calcSetupPriceFromRules(data.setup as SetupPricingRule[], monthlyRevenue, cnpjCount, segmentType)
    : { classification: "padrao" as const, base: 0, surcharge: 0, total: 0 };

  const animatedRecorrencia = useCountUp(finalRecorrencia);
  const animatedSetup = useCountUp(setupResult.total);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "CFO as a Service" }]} />

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Calculadora — CFO as a Service</h1>
          <p className="text-muted-foreground mt-2">Configure os parâmetros para precificar mensalidade e setup.</p>
        </div>

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="rounded-2xl border border-border bg-card p-6">
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
                            {Number(g.fee) > 0 ? ` (+ ${formatBRL(Number(g.fee))})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    Complexidade <InfoTooltip text={TOOLTIPS.complexidade} />
                  </h2>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                    Score: <span className="font-semibold text-foreground">{complexityScore}</span> · {cf.label} (×{cf.factor})
                  </span>
                </div>
                <div className="space-y-5">
                  {COMPLEXITY_LABELS.map((label, i) => (
                    <ComplexityRow
                      key={label}
                      label={label}
                      value={complexity[i]}
                      onChange={(v) => {
                        const next = [...complexity];
                        next[i] = v;
                        setComplexity(next);
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 rounded-2xl border-2 border-primary bg-card overflow-hidden"
                   style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
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

                    <div className="mt-3 rounded-xl bg-primary/15 border border-primary p-4">
                      <p className="text-xs uppercase tracking-wider text-primary">Valor mensal</p>
                      <p className="text-3xl font-bold text-primary mt-1 tabular-nums">{formatBRL(animatedRecorrencia)}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="setup" className="p-5 space-y-4 mt-0">
                    <Row label="Classificação" value={setupResult.classification === "padrao" ? "Padrão" : "Complexo"} />
                    <Row label="Setup base" value={formatBRL(setupResult.base)} />
                    <Row label="Adicional por segmento" value={setupResult.surcharge > 0 ? formatBRL(setupResult.surcharge) : "—"} />

                    <div className="mt-3 rounded-xl bg-primary/15 border border-primary p-4">
                      <p className="text-xs uppercase tracking-wider text-primary">Valor do setup</p>
                      <p className="text-3xl font-bold text-primary mt-1 tabular-nums">{formatBRL(animatedSetup)}</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="px-5 pb-5">
                  <div className="rounded-xl border border-border bg-background/40 p-4 text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investimento mensal</span>
                      <span className="font-semibold tabular-nums">{formatBRL(finalRecorrencia)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Implantação (setup)</span>
                      <span className="font-semibold tabular-nums">{formatBRL(setupResult.total)}</span>
                    </div>
                  </div>
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
                          ["Mensalidade", formatBRL(finalRecorrencia)],
                          ["Setup", formatBRL(setupResult.total)],
                        ],
                        finalLabel: "Investimento mensal",
                        finalValue: formatBRL(finalRecorrencia),
                      })
                    }
                    className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="mr-2 h-4 w-4" /> Exportar PDF
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function ComplexityRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const levelLabel = value === 1 ? "Baixa" : value === 2 ? "Média" : "Alta";
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{levelLabel}</span>
      </div>
      <Slider value={[value]} min={1} max={3} step={1} onValueChange={(v) => onChange(v[0])} />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-0.5">
        <span>Baixa</span><span>Média</span><span>Alta</span>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold && "font-semibold", "tabular-nums")}>{value}</span>
    </div>
  );
}
