import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatBRL } from "@/lib/pricing-shared";
import { useAssessoriaPricing, type AssessoriaRule } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState, useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InfoTooltip, TOOLTIPS } from "@/components/InfoTooltip";
import { exportCalculatorPDF } from "@/lib/pdf-export";

export const Route = createFileRoute("/calculadora/assessoria")({
  component: AssessoriaPage,
});

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
  const { data, isLoading, error, refetch } = useAssessoriaPricing();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [cnpjCount, setCnpjCount] = useState(1);

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  const tier = useMemo(
    () => (data ? lookupTier(data.rules, monthlyRevenue) : null),
    [data, monthlyRevenue],
  );

  const ajusteCnpj = (cnpjCount - 1) * (data?.settings.cnpj_adjustment ?? 0);
  const minP = Number(data?.settings.min_price ?? 0);
  const maxP = Number(data?.settings.max_price ?? Infinity);
  const baseP = Number(tier?.base_price ?? 0);
  const valorFinal = Math.min(maxP, Math.max(minP, baseP + ajusteCnpj));
  const animatedFinal = useCountUp(valorFinal);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "Assessoria Estratégica" }]} />
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Assessoria Estratégica</h1>
        </div>

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {data && (
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
            </section>

            <aside className="rounded-2xl border-2 border-primary bg-card p-6"
                   style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
              <p className="text-xs uppercase tracking-wider text-primary">Investimento mensal</p>
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

              <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                <p className="text-xs uppercase tracking-wider text-primary">Valor mensal</p>
                <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                  {formatBRL(animatedFinal)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Valores limitados entre {formatBRL(minP)} e {formatBRL(maxP)}/mês
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
                    service: "Assessoria Estratégica",
                    clientName: state.companyName,
                    monthlyRevenue,
                    rows: [
                      ["Faixa", tier?.label ?? "—"],
                      ["Preço base", formatBRL(baseP)],
                      ["CNPJs", String(cnpjCount)],
                      ["Ajuste CNPJ", formatBRL(ajusteCnpj)],
                    ],
                    finalLabel: "Valor mensal",
                    finalValue: formatBRL(valorFinal),
                  })
                }
                className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="mr-2 h-4 w-4" /> Exportar PDF
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
