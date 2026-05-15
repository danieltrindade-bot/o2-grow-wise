import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Download, Check } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { calcSetupPrice, formatBRL, type SegmentType } from "@/lib/pricing-shared";
import { exportCalculatorPDF } from "@/lib/pdf-export";

export const Route = createFileRoute("/calculadora/oxy")({
  component: OxyPage,
});

const INCLUDES = [
  "Plataforma Oxy (dados em tempo real)",
  "Agente IA Gênio",
  "Implantação completa",
];

function OxyPage() {
  const { state } = useDiagnostic();
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [cnpjCount, setCnpjCount] = useState(1);
  const [segmentType, setSegmentType] = useState<SegmentType>("mesmo");

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  useEffect(() => {
    if (cnpjCount === 1 && segmentType !== "mesmo") setSegmentType("mesmo");
  }, [cnpjCount, segmentType]);

  const result = calcSetupPrice(monthlyRevenue, cnpjCount, segmentType);
  const parcela = result.total / 12;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Oxy + Gênio — Plataforma de Dados + IA</h1>
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
            <div className="space-y-2">
              <Label>Tipo de segmento</Label>
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

          <aside className="rounded-2xl border-2 border-primary bg-card p-6"
                 style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
            <p className="text-xs uppercase tracking-wider text-primary">Investimento</p>
            <Row label="Classificação" value={result.classification === "padrao" ? "Padrão" : "Complexo"} />
            <Row label="Valor base" value={formatBRL(result.base)} />
            {result.surcharge > 0 && (
              <Row label="Adicional segmento" value={formatBRL(result.surcharge)} />
            )}
            <Row label="Valor total do projeto" value={formatBRL(result.total)} bold />

            <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
              <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider">
                <CreditCard className="h-4 w-4" /> No cartão
              </div>
              <p className="text-3xl md:text-4xl font-bold text-primary mt-1">
                12x de {formatBRL(parcela)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Valor total: {formatBRL(result.total)}
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
