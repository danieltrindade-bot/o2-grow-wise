import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { exportCalculatorPDF, formatBRL as fmtBRL } from "@/lib/pdf-export";

export const Route = createFileRoute("/calculadora/bpo")({
  component: CalculadoraBPOPage,
});

const DIAS_UTEIS = 22;
const MARKUP_PERCENT = 20;
const TIER1_LIMIT = 200;
const TIER2_LIMIT = 500;
const SETUP_MENSAL = 887;

type TierKey = "tier1" | "tier2" | "tier3";

interface Pacote {
  id: string;
  name: string;
  prices: Record<TierKey, number>;
  deliverables: string[];
}

const PACOTES: Pacote[] = [
  {
    id: "essencial",
    name: "Essencial Financeiro",
    prices: { tier1: 1500, tier2: 2500, tier3: 4000 },
    deliverables: [
      "Contas a pagar",
      "Contas a receber",
      "Conciliação bancária",
      "Fluxo de caixa semanal",
    ],
  },
  {
    id: "controle",
    name: "Controle Financeiro",
    prices: { tier1: 2500, tier2: 4000, tier3: 6000 },
    deliverables: [
      "Tudo do Essencial",
      "DRE mensal",
      "Indicadores financeiros",
      "Relatórios gerenciais",
    ],
  },
  {
    id: "estrategica",
    name: "Gestão Financeira Estratégica",
    prices: { tier1: 4000, tier2: 6500, tier3: 10000 },
    deliverables: [
      "Tudo do Controle",
      "Budget anual",
      "Análise de cenários",
      "Planejamento tributário básico",
    ],
  },
];

const SETUP_DELIVERABLES = [
  "Estudo prévio do cliente",
  "Reunião de kick-off (início onboarding)",
  "Reuniões de mapeamento de dados",
  "Parametrização da plataforma Oxy",
  "Integração com ERP",
  "Treinamento da equipe",
  "Implantação de dashboards",
  "Setup do Agente Gênio",
  "Parametrização de alertas",
  "Conciliação inicial",
  "Plano de contas revisado",
  "Centros de custo definidos",
  "Fluxo de aprovações",
  "Régua de cobrança",
  "Go-live assistido",
];

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "d7", label: "Pagamento em 7 dias", percent: 7 },
  { id: "meeting", label: "Fechamento em reunião", percent: 15 },
];

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function tierFor(lancamentosMes: number): { key: TierKey; label: string } {
  if (lancamentosMes <= TIER1_LIMIT) return { key: "tier1", label: `Tier 1 (≤${TIER1_LIMIT})` };
  if (lancamentosMes <= TIER2_LIMIT) return { key: "tier2", label: `Tier 2 (${TIER1_LIMIT + 1}–${TIER2_LIMIT})` };
  return { key: "tier3", label: `Tier 3 (>${TIER2_LIMIT})` };
}

function CalculadoraBPOPage() {
  const { state } = useDiagnostic();

  const [clientName, setClientName] = useState("");
  const [contasPagarDia, setContasPagarDia] = useState(5);
  const [contasReceberDia, setContasReceberDia] = useState(5);
  const [funcionarios, setFuncionarios] = useState(10);
  const [bancos, setBancos] = useState(2);
  const [pacoteId, setPacoteId] = useState<string>("essencial");
  const [discountId, setDiscountId] = useState<string>("none");

  useEffect(() => {
    if (!clientName && state.companyName) setClientName(state.companyName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.companyName]);

  const lancamentosMensais = (contasPagarDia + contasReceberDia) * DIAS_UTEIS;
  const tier = useMemo(() => tierFor(lancamentosMensais), [lancamentosMensais]);
  const pacote = PACOTES.find((p) => p.id === pacoteId)!;
  const basePrice = pacote.prices[tier.key];
  const valorMensalBPO = basePrice * (1 + MARKUP_PERCENT / 100);
  const valorMensalSetup = SETUP_MENSAL;
  const valorMensalTotal = valorMensalBPO + valorMensalSetup;
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const valorComDesconto = valorMensalTotal * (1 - discount.percent / 100);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Calculadora — BPO Financeiro</h1>
          <p className="text-muted-foreground mt-2">
            Configure os parâmetros para calcular o valor mensal da operação.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form + packages */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Dados do Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Nome do Cliente</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Lançamentos/dia — Contas a Pagar</Label>
                  <Input
                    type="number"
                    min={1}
                    value={contasPagarDia}
                    onChange={(e) => setContasPagarDia(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lançamentos/dia — Contas a Receber</Label>
                  <Input
                    type="number"
                    min={1}
                    value={contasReceberDia}
                    onChange={(e) => setContasReceberDia(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Funcionários <span className="text-muted-foreground text-xs">(informativo)</span></Label>
                  <Input
                    type="number"
                    min={1}
                    value={funcionarios}
                    onChange={(e) => setFuncionarios(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bancos <span className="text-muted-foreground text-xs">(informativo)</span></Label>
                  <Input
                    type="number"
                    min={1}
                    value={bancos}
                    onChange={(e) => setBancos(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-secondary px-3 py-1">
                  Lançamentos/mês: <span className="font-semibold text-foreground">{lancamentosMensais}</span>
                </span>
                <span className="rounded-full bg-secondary px-3 py-1">
                  {tier.label}
                </span>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">Pacote</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PACOTES.map((p) => {
                  const selected = p.id === pacoteId;
                  const price = p.prices[tier.key];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPacoteId(p.id)}
                      className={cn(
                        "text-left rounded-2xl border bg-card p-5 transition-all",
                        selected
                          ? "border-primary shadow-[0_0_0_1px_var(--color-primary)]"
                          : "border-border hover:border-primary/60",
                      )}
                    >
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-2xl font-bold mt-2">{formatBRL(price)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                      <p className="text-xs text-muted-foreground mt-1">no {tier.label}</p>
                      <ul className="mt-4 space-y-1.5">
                        {p.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary">Obrigatório</p>
                  <h2 className="text-lg font-semibold mt-1">SETUP + OXY + GÊNIO</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    12x de {formatBRL(SETUP_MENSAL)} — incluído no valor mensal
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                {SETUP_DELIVERABLES.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-primary bg-primary/15 shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Desconto</h2>
              <RadioGroup value={discountId} onValueChange={setDiscountId} className="space-y-2">
                {DISCOUNTS.map((d) => (
                  <label
                    key={d.id}
                    htmlFor={`disc-${d.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-xl border bg-background p-3 cursor-pointer",
                      discountId === d.id ? "border-primary" : "border-border",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem id={`disc-${d.id}`} value={d.id} />
                      <span className="text-sm">{d.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{d.percent}%</span>
                  </label>
                ))}
              </RadioGroup>
            </section>
          </div>

          {/* Result panel */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 rounded-2xl border-2 border-primary bg-card p-6"
                 style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
              <p className="text-xs uppercase tracking-wider text-primary">Proposta</p>
              <h2 className="text-xl font-bold mt-1">{clientName || "Cliente"}</h2>

              <dl className="mt-5 space-y-2 text-sm">
                <Row label="Pacote" value={pacote.name} />
                <Row label="Tier" value={tier.label} />
                <Row label="Lançamentos/mês" value={String(lancamentosMensais)} />
              </dl>

              <div className="my-5 border-t border-border" />

              <dl className="space-y-2 text-sm">
                <Row label="Valor mensal BPO" value={formatBRL(valorMensalBPO)} />
                <Row label="Setup mensal (12x)" value={formatBRL(valorMensalSetup)} />
                <Row label="Subtotal mensal" value={formatBRL(valorMensalTotal)} bold />
                <Row label="Desconto aplicado" value={`${discount.percent}%`} />
              </dl>

              <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-4">
                <p className="text-xs uppercase tracking-wider text-primary">Valor final mensal</p>
                <p className="text-3xl md:text-4xl font-bold text-primary mt-1">
                  {formatBRL(valorComDesconto)}
                </p>
              </div>

              <Button className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" /> Exportar Proposta
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn(bold && "font-semibold")}>{value}</dd>
    </div>
  );
}
