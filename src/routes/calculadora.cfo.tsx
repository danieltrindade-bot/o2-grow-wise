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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportCalculatorPDF } from "@/lib/pdf-export";

export const Route = createFileRoute("/calculadora/cfo")({
  component: CalculadoraCFOPage,
});

type SegmentType = "mesmo" | "correlato" | "diferente" | "muito_diferente";
type GovernanceType = "simples" | "gerencial" | "multiempresa";

const SEGMENT_ADJ: Record<SegmentType, number> = {
  mesmo: 0,
  correlato: 10,
  diferente: 20,
  muito_diferente: 30,
};

const GOVERNANCE_FEE: Record<GovernanceType, number> = {
  simples: 0,
  gerencial: 2000,
  multiempresa: 5000,
};

const CNPJ_MULTIPLIER: Record<number, number> = {
  1: 1.0, 2: 1.3, 3: 1.5, 4: 1.7, 5: 1.9,
  6: 2.1, 7: 2.3, 8: 2.5, 9: 2.7, 10: 2.9,
};

interface BaseTier {
  max: number; // exclusive upper bound (Infinity for last)
  price: number;
}

const BASE_TIERS_ANNUAL: BaseTier[] = [
  { max: 500_000, price: 7_500 },
  { max: 1_000_000, price: 10_000 },
  { max: 2_500_000, price: 15_000 },
  { max: 5_000_000, price: 20_000 },
  { max: 10_000_000, price: 28_000 },
  { max: 25_000_000, price: 38_000 },
  { max: 50_000_000, price: 50_000 },
  { max: Infinity, price: 65_000 },
];

function lookupBasePrice(annualRevenue: number): number {
  for (const t of BASE_TIERS_ANNUAL) {
    if (annualRevenue < t.max) return t.price;
  }
  return BASE_TIERS_ANNUAL[BASE_TIERS_ANNUAL.length - 1].price;
}

interface SetupTier {
  max: number;
  padrao: number;
  complexo: number;
}

const SETUP_TIERS_MONTHLY: SetupTier[] = [
  { max: 100_000, padrao: 10_000, complexo: 15_000 },
  { max: 200_000, padrao: 10_000, complexo: 15_000 },
  { max: 350_000, padrao: 10_000, complexo: 15_000 },
  { max: 500_000, padrao: 15_000, complexo: 15_000 },
  { max: 1_000_000, padrao: 15_000, complexo: 20_000 },
  { max: 2_500_000, padrao: 20_000, complexo: 25_000 },
  { max: 5_000_000, padrao: 25_000, complexo: 30_000 },
  { max: Infinity, padrao: 35_000, complexo: 40_000 },
];

function lookupSetupBase(monthlyRevenue: number, classification: "padrao" | "complexo"): number {
  for (const t of SETUP_TIERS_MONTHLY) {
    if (monthlyRevenue < t.max) return t[classification];
  }
  const last = SETUP_TIERS_MONTHLY[SETUP_TIERS_MONTHLY.length - 1];
  return last[classification];
}

function complexityFactor(score: number): { factor: number; label: string } {
  if (score <= 8) return { factor: 1.0, label: "Baixa" };
  if (score <= 12) return { factor: 1.15, label: "Média" };
  if (score <= 15) return { factor: 1.3, label: "Alta" };
  return { factor: 1.5, label: "Muito Alta" };
}

function classify(cnpjCount: number, segmentType: SegmentType): "padrao" | "complexo" {
  if (cnpjCount === 1) return "padrao";
  if (cnpjCount >= 2 && cnpjCount <= 5 && segmentType === "mesmo") return "padrao";
  return "complexo";
}

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const COMPLEXITY_LABELS = ["Segmento", "Operação", "ERP", "Governança", "Estrutura Societária", "Consolidação"];

function CalculadoraCFOPage() {
  const { state } = useDiagnostic();

  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [cnpjCount, setCnpjCount] = useState<number>(1);
  const [segmentType, setSegmentType] = useState<SegmentType>("mesmo");
  const [governanceType, setGovernanceType] = useState<GovernanceType>("simples");
  const [complexity, setComplexity] = useState<number[]>([2, 2, 2, 2, 2, 2]);

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) {
      setMonthlyRevenue(state.monthlyRevenue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  // When CNPJ = 1, force segment to "mesmo"
  useEffect(() => {
    if (cnpjCount === 1 && segmentType !== "mesmo") setSegmentType("mesmo");
  }, [cnpjCount, segmentType]);

  const annualRevenue = monthlyRevenue * 12;
  const basePrice = useMemo(() => lookupBasePrice(annualRevenue), [annualRevenue]);
  const cnpjMultiplier = CNPJ_MULTIPLIER[Math.max(1, Math.min(10, cnpjCount))];
  const complexityScore = complexity.reduce((s, v) => s + v, 0);
  const cf = complexityFactor(complexityScore);
  const segmentAdj = cnpjCount > 1 ? SEGMENT_ADJ[segmentType] : 0;
  const governanceFee = GOVERNANCE_FEE[governanceType];

  const subtotalRecorrencia = basePrice * cnpjMultiplier * cf.factor;
  const finalRecorrencia = subtotalRecorrencia * (1 + segmentAdj / 100) + governanceFee;

  const classification = classify(cnpjCount, segmentType);
  const setupBase = lookupSetupBase(monthlyRevenue, classification);
  const adicionalSegmento =
    segmentType !== "mesmo" && cnpjCount > 1 ? (cnpjCount - 1) * 3_000 : 0;
  const setupTotal = setupBase + adicionalSegmento;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Calculadora — CFO as a Service</h1>
          <p className="text-muted-foreground mt-2">
            Configure os parâmetros para precificar mensalidade e setup.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Parâmetros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Faturamento mensal</Label>
                  <CurrencyInput
                    value={monthlyRevenue}
                    onValueChange={setMonthlyRevenue}
                  />
                  <p className="text-xs text-muted-foreground">
                    Anual (estimado): {formatBRL(annualRevenue)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade de CNPJs</Label>
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
                  <Label>Tipo de segmento</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Disponível com 2+ CNPJs
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Tipo de governança</Label>
                  <Select
                    value={governanceType}
                    onValueChange={(v) => setGovernanceType(v as GovernanceType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples">Simples</SelectItem>
                      <SelectItem value="gerencial">Gerencial (+ R$ 2.000)</SelectItem>
                      <SelectItem value="multiempresa">Multiempresa (+ R$ 5.000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Complexidade</h2>
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

          {/* Result */}
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
                  <Row
                    label="Ajuste segmento"
                    value={cnpjCount > 1 ? `+${segmentAdj}%` : "—"}
                  />
                  <Row label="Taxa governança" value={formatBRL(governanceFee)} />

                  <div className="mt-3 rounded-xl bg-primary/15 border border-primary p-4">
                    <p className="text-xs uppercase tracking-wider text-primary">Valor mensal</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {formatBRL(finalRecorrencia)}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="setup" className="p-5 space-y-4 mt-0">
                  <Row
                    label="Classificação"
                    value={classification === "padrao" ? "Padrão" : "Complexo"}
                  />
                  <Row label="Setup base" value={formatBRL(setupBase)} />
                  <Row
                    label="Adicional por segmento"
                    value={adicionalSegmento > 0 ? formatBRL(adicionalSegmento) : "—"}
                  />

                  <div className="mt-3 rounded-xl bg-primary/15 border border-primary p-4">
                    <p className="text-xs uppercase tracking-wider text-primary">Valor do setup</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {formatBRL(setupTotal)}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="px-5 pb-5">
                <div className="rounded-xl border border-border bg-background/40 p-4 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Investimento mensal</span>
                    <span className="font-semibold">{formatBRL(finalRecorrencia)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Implantação (setup)</span>
                    <span className="font-semibold">{formatBRL(setupTotal)}</span>
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
                        ["Setup", formatBRL(setupTotal)],
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
      </div>
    </div>
  );
}

function ComplexityRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const levelLabel = value === 1 ? "Baixa" : value === 2 ? "Média" : "Alta";
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{levelLabel}</span>
      </div>
      <Slider
        value={[value]}
        min={1}
        max={3}
        step={1}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-0.5">
        <span>Baixa</span>
        <span>Média</span>
        <span>Alta</span>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold && "font-semibold")}>{value}</span>
    </div>
  );
}
