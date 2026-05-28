import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Download } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/pricing-shared";
import { useCountUp } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Row } from "@/components/calc-row";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation, SERVICE_DETAILS } from "@/components/ProductPresentation";
import { exportCalculatorPDF } from "@/lib/pdf-export";

export const Route = createFileRoute("/calculadora/coordenador")({
  component: CoordenadorPage,
});

type Perfil = "essencial" | "estruturado" | "integrado";

const PERFIL_LABELS: Record<Perfil, string> = {
  essencial: "Essencial",
  estruturado: "Estruturado",
  integrado: "Integrado",
};

const FASE1_PRICES: Record<Perfil, number> = {
  essencial: 3926,
  estruturado: 5417,
  integrado: 6908,
};

const FASE2_PRICES: Record<Perfil, number> = {
  essencial: 2087,
  estruturado: 2982,
  integrado: 4174,
};

function getPerfil(colabCount: number, cnpjCount: number): Perfil {
  const byColab: Perfil = colabCount <= 3 ? "essencial" : colabCount <= 8 ? "estruturado" : "integrado";
  const byCnpj: Perfil = cnpjCount <= 1 ? "essencial" : cnpjCount <= 2 ? "estruturado" : "integrado";
  const order: Perfil[] = ["essencial", "estruturado", "integrado"];
  return order[Math.max(order.indexOf(byColab), order.indexOf(byCnpj))];
}

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
  const [colabCount, setColabCount] = useState(1);
  const [cnpjCount, setCnpjCount] = useState(1);
  const [discountId, setDiscountId] = useState("none");
  const [showPrices, setShowPrices] = useState(false);

  const perfil = useMemo(() => getPerfil(colabCount, cnpjCount), [colabCount, cnpjCount]);
  const fase1 = FASE1_PRICES[perfil];
  const fase2 = FASE2_PRICES[perfil];
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const fase1ComDesconto = fase1 * (1 - discount.percent / 100);
  const fase2ComDesconto = fase2 * (1 - discount.percent / 100);
  const parcela12x = fase1ComDesconto / 12;
  const totalMensal = fase2ComDesconto + parcela12x;
  const animatedTotal = useCountUp(totalMensal);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Parâmetros</h2>
              <div className="space-y-2">
                <Label>Colaboradores na área financeira</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={colabCount}
                  onChange={(e) => setColabCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                />
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
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Perfil identificado</p>
                <p className="text-lg font-semibold text-primary">{PERFIL_LABELS[perfil]}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {perfil === "essencial" && "Até 3 colaboradores | 1 CNPJ"}
                  {perfil === "estruturado" && "4–8 colaboradores | 1–2 CNPJs"}
                  {perfil === "integrado" && "9+ colaboradores | Multi-CNPJ"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h2 className="text-lg font-semibold">Desconto</h2>
              {DISCOUNTS.map((d) => {
                const selected = discountId === d.id;
                return (
                  <label
                    key={d.id}
                    className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors ${
                      selected ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="coordenador-discount"
                        value={d.id}
                        checked={selected}
                        onChange={() => setDiscountId(d.id)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm">{d.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{d.percent}%</span>
                  </label>
                );
              })}
            </section>
          </div>

          <aside className="rounded-2xl border-2 border-primary bg-card p-6"
                 style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
            <p className="text-xs uppercase tracking-wider text-primary">Investimento</p>
            {showPrices ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Row label="Perfil" value={PERFIL_LABELS[perfil]} />

                <div className="mt-4 mb-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Fase 1 — Implantação</p>
                </div>
                <Row label="Valor implantação" value={formatBRL(fase1)} />
                {discount.percent > 0 && (
                  <Row label={`Desconto (${discount.percent}%)`} value={`-${formatBRL(fase1 - fase1ComDesconto)}`} />
                )}
                <Row label="Parcela 12x" value={formatBRL(parcela12x)} bold />

                <div className="mt-4 mb-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Fase 2 — Acompanhamento</p>
                </div>
                <Row label="Valor mensal" value={formatBRL(fase2)} />
                {discount.percent > 0 && (
                  <Row label={`Desconto (${discount.percent}%)`} value={`-${formatBRL(fase2 - fase2ComDesconto)}`} />
                )}
                <Row label="Recorrência" value={formatBRL(fase2ComDesconto)} bold />

                <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                  <p className="text-xs uppercase tracking-wider text-primary">Investimento mensal total</p>
                  <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                    {formatBRL(animatedTotal)}<span className="text-sm font-normal text-primary/70">/mês</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acompanhamento: {formatBRL(fase2ComDesconto)} + Implantação 12x: {formatBRL(parcela12x)}
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
                      clientName: state.companyName,
                      monthlyRevenue: 0,
                      rows: [
                        ["Perfil", PERFIL_LABELS[perfil]],
                        ["Colaboradores", String(colabCount)],
                        ["CNPJs", String(cnpjCount)],
                        ["Implantação (Fase 1)", formatBRL(fase1ComDesconto)],
                        ["Implantação 12x", formatBRL(parcela12x)],
                        ["Acompanhamento (Fase 2)", formatBRL(fase2ComDesconto)],
                        ...(discount.percent > 0 ? [["Desconto", `${discount.percent}% — ${discount.label}`] as [string, string]] : []),
                      ],
                      finalLabel: "Investimento mensal",
                      finalValue: formatBRL(totalMensal),
                      scope: SERVICE_DETAILS.coordenador.deliverables,
                    })
                  }
                  className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="mr-2 h-4 w-4" /> Exportar PDF
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <Row label="Perfil" value={PERFIL_LABELS[perfil]} />
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
      </div>

      <MobilePriceSummary label="Total mensal" value={formatBRL(totalMensal)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}
