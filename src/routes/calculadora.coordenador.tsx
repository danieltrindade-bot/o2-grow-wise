import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { calcSetupPriceFromRules, formatBRL, type SegmentType } from "@/lib/pricing-shared";
import { useCoordenadorPricing } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState, useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Row } from "@/components/calc-row";
import { InfoTooltip, TOOLTIPS } from "@/components/InfoTooltip";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation } from "@/components/ProductPresentation";
import { exportCalculatorPDF } from "@/lib/pdf-export";

export const Route = createFileRoute("/calculadora/coordenador")({
  component: CoordenadorPage,
});

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "d7", label: "Pagamento em 7 dias", percent: 7 },
  { id: "meeting", label: "Fechamento em reunião", percent: 15 },
];

const INCLUDES = [
  "Coordenador financeiro dedicado",
  "Gestão de equipe financeira",
  "Processos e controles",
  "Reporte executivo",
];

function CoordenadorPage() {
  const { state } = useDiagnostic();
  const { data: rules, isLoading, error, refetch } = useCoordenadorPricing();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [cnpjCount, setCnpjCount] = useState(1);
  const [segmentType, setSegmentType] = useState<SegmentType>("mesmo");
  const [discountId, setDiscountId] = useState<string>("none");

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  useEffect(() => {
    if (cnpjCount === 1 && segmentType !== "mesmo") setSegmentType("mesmo");
  }, [cnpjCount, segmentType]);

  const result = rules
    ? calcSetupPriceFromRules(rules, monthlyRevenue, cnpjCount, segmentType)
    : { classification: "padrao" as const, base: 0, surcharge: 0, total: 0 };
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const totalComDesconto = result.total * (1 - discount.percent / 100);
  const parcela12x = totalComDesconto / 12;
  const animatedParcela = useCountUp(parcela12x);
  const [showPrices, setShowPrices] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "Coordenador as a Service" }]} />
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Coordenador as a Service</h1>
        </div>

        <ProductPresentation serviceKey="coordenador" title="Coordenador as a Service" />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {rules && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div className="space-y-2">
                <Label>Desconto</Label>
                <RadioGroup value={discountId} onValueChange={setDiscountId} className="space-y-2">
                  {DISCOUNTS.map((d) => (
                    <label key={d.id} htmlFor={`disc-coord-${d.id}`}
                      className={cn("flex items-center justify-between rounded-xl border bg-background p-3 cursor-pointer",
                        discountId === d.id ? "border-primary" : "border-border")}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem id={`disc-coord-${d.id}`} value={d.id} />
                        <span className="text-sm">{d.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{d.percent}%</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </section>

            <aside className="rounded-2xl border-2 border-primary bg-card p-6"
                   style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
              <p className="text-xs uppercase tracking-wider text-primary">Investimento</p>
              {showPrices ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Row label="Valor base" value={formatBRL(result.base)} />
                  {result.surcharge > 0 && (
                    <Row label="Adicional segmento" value={formatBRL(result.surcharge)} />
                  )}

                  <Row label="Valor total do projeto" value={formatBRL(result.total)} bold />
                  <Row label="Desconto aplicado" value={`${discount.percent}%`} />
                  {discount.percent > 0 && (
                    <Row label="Valor com desconto" value={formatBRL(totalComDesconto)} bold />
                  )}

                  <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                    <p className="text-xs uppercase tracking-wider text-primary">12x de</p>
                    <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                      {formatBRL(animatedParcela)}<span className="text-sm font-normal text-primary/70">/mês</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor total: {formatBRL(totalComDesconto)}
                    </p>
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
                        service: "Coordenador as a Service",
                        serviceKey: "coordenador",
                        clientName: state.companyName,
                        monthlyRevenue,
                        rows: [
                          ["CNPJs", String(cnpjCount)],
                          ["Segmento", segmentType],
                          ["Valor base", formatBRL(result.base)],
                          ["Adicional segmento", formatBRL(result.surcharge)],
                          ["Valor total", formatBRL(result.total)],
                          ["Desconto", `${discount.percent}%`],
                          ["Valor com desconto", formatBRL(totalComDesconto)],
                        ],
                        finalLabel: "12x de",
                        finalValue: formatBRL(parcela12x),
                      })
                    }
                    className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="mr-2 h-4 w-4" /> Exportar PDF
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
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
                    Investimento
                  </Button>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      <MobilePriceSummary label="12x de" value={formatBRL(parcela12x)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}

