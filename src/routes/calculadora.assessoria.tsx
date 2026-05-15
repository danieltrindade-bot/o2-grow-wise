import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatBRL } from "@/lib/pricing-shared";

export const Route = createFileRoute("/calculadora/assessoria")({
  component: AssessoriaPage,
});

interface AssessoriaTier {
  max: number;
  base: number;
  label: string;
}

const TIERS: AssessoriaTier[] = [
  { max: 200_000, base: 4_170, label: "Até R$ 200k/mês" },
  { max: 500_000, base: 4_980, label: "R$ 200k – 500k/mês" },
  { max: 1_000_000, base: 5_780, label: "R$ 500k – 1M/mês" },
  { max: 2_500_000, base: 6_970, label: "R$ 1M – 2,5M/mês" },
  { max: Infinity, base: 8_570, label: "Acima de R$ 2,5M/mês" },
];

const MIN_PRICE = 4_170;
const MAX_PRICE = 8_570;

const INCLUDES = [
  "Jornada de maturidade financeira",
  "Acompanhamento personalizado",
  "Diagnóstico estratégico aprofundado",
];

function lookupTier(monthlyRevenue: number): AssessoriaTier {
  for (const t of TIERS) if (monthlyRevenue < t.max) return t;
  return TIERS[TIERS.length - 1];
}

function AssessoriaPage() {
  const { state } = useDiagnostic();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [cnpjCount, setCnpjCount] = useState(1);

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  const tier = useMemo(() => lookupTier(monthlyRevenue), [monthlyRevenue]);
  const ajusteCnpj = (cnpjCount - 1) * 500;
  const valorFinal = Math.min(MAX_PRICE, Math.max(MIN_PRICE, tier.base + ajusteCnpj));

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Assessoria Estratégica</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Parâmetros</h2>
            <div className="space-y-2">
              <Label>Faturamento mensal</Label>
              <CurrencyInput value={monthlyRevenue} onValueChange={setMonthlyRevenue} />
            </div>
            <div className="space-y-2">
              <Label>Quantidade de CNPJs</Label>
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
            <Row label="Faixa de faturamento" value={tier.label} />
            <Row label="Preço base" value={formatBRL(tier.base)} />
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
              <p className="text-3xl md:text-4xl font-bold text-primary mt-1">
                {formatBRL(valorFinal)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Valores limitados entre {formatBRL(MIN_PRICE)} e {formatBRL(MAX_PRICE)}/mês
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

            <Button className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="mr-2 h-4 w-4" /> Exportar Proposta
            </Button>
          </aside>
        </div>
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
