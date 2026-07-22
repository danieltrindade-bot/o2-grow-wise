import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Download, Check, FileText } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { calcSetupPriceFromRules, formatBRL, type SegmentType } from "@/lib/pricing-shared";
import { useOxyPricing } from "@/hooks/use-pricing";
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
import { ContractGenerator } from "@/components/ContractGenerator";
import { DiretoContractGenerator } from "@/components/DiretoContractGenerator";

export const Route = createFileRoute("/calculadora/oxy")({
  component: OxyPage,
});

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "meeting", label: "Condição de fechamento da reunião", percent: 15 },
];

// Oxy: o setup não pode ser vendido abaixo deste piso em nenhum cenário,
// mesmo após desconto ou ajustes de preço no admin.
const OXY_SETUP_FLOOR = 8000;

const INCLUDES = [
  "Plataforma Oxy (dados em tempo real)",
  "Agente IA Gênio",
  "Implantação completa",
];

function OxyPage() {
  const { state } = useDiagnostic();
  const { lossMinMonthly } = useDiagnosticLoss();
  const { data: rules, isLoading, error, refetch } = useOxyPricing();
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

  const result = rules
    ? calcSetupPriceFromRules(rules, monthlyRevenue, cnpjCount, segmentType)
    : { classification: "padrao" as const, base: 0, surcharge: 0, total: 0 };
  const projectTotal = rules ? Math.max(result.total, OXY_SETUP_FLOOR) : 0;
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const totalComDesconto = rules
    ? Math.max(projectTotal * (1 - discount.percent / 100), OXY_SETUP_FLOOR)
    : 0;
  const parcela = totalComDesconto / 12;
  const animatedParcela = useCountUp(parcela);
  const [showPrices, setShowPrices] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showDireto, setShowDireto] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "Oxy + Gênio" }]} />
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Oxy + Gênio — Plataforma de Dados + IA</h1>
        </div>

        <ProductPresentation serviceKey="oxy" title="Oxy + Gênio" />

        <LossSummaryPanel />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {rules && (<>
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
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <button
                type="button"
                onClick={() => setDiscountId(discountId === "meeting" ? "none" : "meeting")}
                className={cn("flex w-full items-center gap-3 rounded-xl border bg-background p-3 cursor-pointer text-left",
                  discountId === "meeting" ? "border-primary bg-primary/10" : "border-border")}>
                <span className={cn("h-4 w-4 rounded-full border-2 shrink-0",
                  discountId === "meeting" ? "border-primary bg-primary" : "border-muted-foreground")} />
                <span className="text-sm">Condição de fechamento da reunião</span>
              </button>
            </section>
            </div>

            <aside className="rounded-2xl border-2 border-primary bg-card p-6"
                   style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
              <p className="text-xs uppercase tracking-wider text-primary">Investimento</p>
              {showPrices ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Row label="Classificação" value={result.classification === "padrao" ? "Padrão" : "Complexo"} />
                  <Row label="Valor base" value={formatBRL(result.base)} />
                  {result.surcharge > 0 && (
                    <Row label="Adicional segmento" value={formatBRL(result.surcharge)} />
                  )}
                  <Row label="Valor total do projeto" value={formatBRL(projectTotal)} bold />
                  {discount.percent > 0 && (
                    <Row label={`Desconto (${discount.percent}%)`} value={`-${formatBRL(projectTotal - totalComDesconto)}`} />
                  )}

                  <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                    <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider">
                      <CreditCard className="h-4 w-4" /> No cartão
                    </div>
                    <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                      12x de {formatBRL(animatedParcela)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor total: {formatBRL(totalComDesconto)}
                    </p>
                  </div>

                  <RoiPanel investmentMonthly={parcela} />

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
                        service: "Oxy + Gênio",
                        clientName: state.companyName,
                        monthlyRevenue,
                        rows: [
                          ["Classificação", result.classification === "padrao" ? "Padrão" : "Complexo"],
                          ["CNPJs", String(cnpjCount)],
                          ["Segmento", segmentType],
                          ["Valor base", formatBRL(result.base)],
                          ["Adicional segmento", formatBRL(result.surcharge)],
                          ["Valor total", formatBRL(projectTotal)],
                          ...(discount.percent > 0
                            ? [[`Desconto (${discount.percent}%)`, `-${formatBRL(projectTotal - totalComDesconto)}`] as [string, string]]
                            : []),
                          ["12x no cartão", formatBRL(parcela)],
                        ],
                        finalLabel: "12x de",
                        finalValue: formatBRL(parcela),
                        roi: { lossMinMonthly, investmentMonthly: parcela },
                        scope: SERVICE_DETAILS.oxy.deliverables,
                        scopeIntro: SERVICE_DETAILS.oxy.what,
                      })
                    }
                    className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="mr-2 h-4 w-4" /> Exportar PDF
                  </Button>
                  <Button
                    onClick={() => setShowContract(!showContract)}
                    className="w-full mt-3 bg-card border border-border text-foreground hover:border-primary/60"
                    variant="outline"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Gerar Contrato
                  </Button>
                  <Button
                    onClick={() => setShowDireto(!showDireto)}
                    className="w-full mt-3 bg-card border border-border text-foreground hover:border-primary/60"
                    variant="outline"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Gerar Contrato Direto
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <Row label="Classificação" value={result.classification === "padrao" ? "Padrão" : "Complexo"} />
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

          <ContractGenerator
            modelo="SaaS Oxy + Gênio"
            valorSetup={String(Math.round(totalComDesconto * 100))}
            qtdParcelasSetup={12}
            expanded={showContract}
            onExpandedChange={setShowContract}
          />

          <DiretoContractGenerator
            defaultServico="oxy"
            clientName={state.companyName}
            valorSetupReais={Math.round(totalComDesconto)}
            valorMensalReais={0}
            expanded={showDireto}
            onExpandedChange={setShowDireto}
          />
        </>)}
      </div>

      <MobilePriceSummary label="12x de" value={formatBRL(parcela)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}

