import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { exportCalculatorPDF } from "@/lib/pdf-export";
import { formatBRL } from "@/lib/format";
import { useBPOPricing } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Row } from "@/components/calc-row";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation } from "@/components/ProductPresentation";

export const Route = createFileRoute("/calculadora/bpo")({
  component: CalculadoraBPOPage,
});

type TierKey = "tier1" | "tier2" | "tier3";

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

function CalculadoraBPOPage() {
  const { state } = useDiagnostic();
  const { data, isLoading, error, refetch } = useBPOPricing();

  const [clientName, setClientName] = useState("");
  const [contasPagarDia, setContasPagarDia] = useState(5);
  const [contasReceberDia, setContasReceberDia] = useState(5);
  const [funcionarios, setFuncionarios] = useState(10);
  const [bancos, setBancos] = useState(2);
  const [pacoteId, setPacoteId] = useState<string>("");
  const [discountId, setDiscountId] = useState<string>("none");

  useEffect(() => {
    if (!clientName && state.companyName) setClientName(state.companyName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.companyName]);

  useEffect(() => {
    if (!pacoteId && data?.packages?.length) setPacoteId(data.packages[0].id);
  }, [data, pacoteId]);

  const lancamentosMensais = (contasPagarDia + contasReceberDia) * (data?.settings.dias_uteis ?? 22);
  const tier = useMemo(() => {
    const t1 = data?.settings.tier_1_limit ?? 200;
    const t2 = data?.settings.tier_2_limit ?? 500;
    if (lancamentosMensais <= t1) return { key: "tier1" as TierKey, label: `Tier 1 (≤${t1})` };
    if (lancamentosMensais <= t2) return { key: "tier2" as TierKey, label: `Tier 2 (${t1 + 1}–${t2})` };
    return { key: "tier3" as TierKey, label: `Tier 3 (>${t2})` };
  }, [lancamentosMensais, data]);

  const pacote = data?.packages.find((p) => p.id === pacoteId) ?? data?.packages[0];
  const basePrice = pacote
    ? Number(tier.key === "tier1" ? pacote.price_tier_1 : tier.key === "tier2" ? pacote.price_tier_2 : pacote.price_tier_3)
    : 0;
  const valorMensalBPO = basePrice;
  const valorMensalSetup = data?.setup ? Number(data.setup.installment_value) : 0;
  const valorMensalTotal = valorMensalBPO + (data?.setup?.add_to_monthly ? valorMensalSetup : 0);
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const BPO_MINIMUM = 2100;
  const valorComDesconto = Math.max(BPO_MINIMUM, valorMensalTotal * (1 - discount.percent / 100));
  const [showPrices, setShowPrices] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "BPO Financeiro" }]} />

        <div className="mb-8">
          <h1 className="font-bold tracking-[0.005em]" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>Calculadora — BPO Financeiro</h1>
          <p className="text-muted-foreground mt-2">Configure os parâmetros para calcular o valor mensal da operação.</p>
        </div>

        <ProductPresentation serviceKey="bpo" title="BPO Financeiro" />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {data && pacote && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="rounded-2xl border border-border bg-card p-7">
                <h2 className="text-lg font-semibold mb-4">Dados do Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Nome do Cliente</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lançamentos/dia — Contas a Pagar</Label>
                    <Input type="number" min={1} value={contasPagarDia}
                      onChange={(e) => setContasPagarDia(Math.max(1, Number(e.target.value) || 1))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lançamentos/dia — Contas a Receber</Label>
                    <Input type="number" min={1} value={contasReceberDia}
                      onChange={(e) => setContasReceberDia(Math.max(1, Number(e.target.value) || 1))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Funcionários <span className="text-muted-foreground text-xs">(informativo)</span></Label>
                    <Input type="number" min={1} value={funcionarios}
                      onChange={(e) => setFuncionarios(Math.max(1, Number(e.target.value) || 1))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bancos <span className="text-muted-foreground text-xs">(informativo)</span></Label>
                    <Input type="number" min={1} value={bancos}
                      onChange={(e) => setBancos(Math.max(1, Number(e.target.value) || 1))} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-3 py-1">
                    Lançamentos/mês: <span className="font-semibold text-foreground">{lancamentosMensais}</span>
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1">{tier.label}</span>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-4">Pacote</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.packages.map((p) => {
                    const selected = p.id === pacoteId;
                    const price = Number(tier.key === "tier1" ? p.price_tier_1 : tier.key === "tier2" ? p.price_tier_2 : p.price_tier_3);
                    return (
                      <button key={p.id} type="button" onClick={() => setPacoteId(p.id)}
                        className={cn("text-left rounded-2xl border bg-card p-5 transition-all hover:border-primary/60",
                          selected ? "border-primary shadow-[0_0_0_1px_var(--color-primary)]" : "border-border")}>
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">no {tier.label}</p>
                        {p.description && <p className="text-sm text-muted-foreground mt-3">{p.description}</p>}
                      </button>
                    );
                  })}
                </div>
              </section>

              {data.setup && (
                <section className="rounded-2xl border border-border bg-card p-7">
                  <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Obrigatório</p>
                  <h2 className="text-lg font-semibold mt-1">{data.setup.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.setup.installments} parcelas
                    {data.setup.add_to_monthly && " — incluído no valor mensal"}
                  </p>
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
              )}

              <section className="rounded-2xl border border-border bg-card p-7">
                <h2 className="text-lg font-semibold mb-4">Desconto</h2>
                <RadioGroup value={discountId} onValueChange={setDiscountId} className="space-y-2">
                  {DISCOUNTS.map((d) => (
                    <label key={d.id} htmlFor={`disc-${d.id}`}
                      className={cn("flex items-center justify-between rounded-xl border bg-background p-3 cursor-pointer",
                        discountId === d.id ? "border-primary" : "border-border")}>
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

            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 rounded-2xl border-2 border-primary bg-card p-7"
                   style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
                <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Proposta</p>
                <h2 className="text-xl font-bold mt-1">{clientName || "Cliente"}</h2>
                <dl className="mt-5 space-y-2 text-sm">
                  <Row label="Pacote" value={pacote.name} />
                  <Row label="Tier" value={tier.label} />
                  <Row label="Lançamentos/mês" value={String(lancamentosMensais)} />
                </dl>
                <div className="my-5 border-t border-border" />
                {showPrices ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <dl className="space-y-2 text-sm">
                      <Row label="Valor mensal BPO" value={formatBRL(valorMensalBPO)} />
                      {data.setup?.add_to_monthly && (
                        <Row label={`Setup mensal (${data.setup.installments}x no cartão)`} value={formatBRL(valorMensalSetup)} />
                      )}
                      <Row label="Subtotal mensal" value={formatBRL(valorMensalTotal)} bold />
                      <Row label="Desconto aplicado" value={`${discount.percent}%`} />
                    </dl>
                    <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-4">
                      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Valor final mensal</p>
                      <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                        {formatBRL(valorComDesconto)}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        exportCalculatorPDF({
                          service: "BPO Financeiro",
                          clientName: clientName || state.companyName,
                          rows: [
                            ["Pacote", pacote.name],
                            ["Tier", tier.label],
                            ["Lançamentos/mês", String(lancamentosMensais)],
                            ["Valor mensal BPO", formatBRL(valorMensalBPO)],
                            ["Setup mensal (no cartão)", formatBRL(valorMensalSetup)],
                            ["Subtotal mensal", formatBRL(valorMensalTotal)],
                            ["Desconto", `${discount.percent}%`],
                          ],
                          finalLabel: "Valor final mensal",
                          finalValue: formatBRL(valorComDesconto),
                        })
                      }
                      className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="mr-2 h-4 w-4" /> Exportar PDF
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowPrices(true)}
                    className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Investimento
                  </Button>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      <MobilePriceSummary label="Valor final mensal" value={formatBRL(valorComDesconto)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}

