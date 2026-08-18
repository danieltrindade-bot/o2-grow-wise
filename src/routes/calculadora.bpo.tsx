import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download, FileText } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { exportCalculatorPDF } from "@/lib/pdf-export";
import { formatBRL } from "@/lib/format";
import { useBPOPricing } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LossSummaryPanel } from "@/components/LossSummaryPanel";
import { RoiPanel } from "@/components/RoiPanel";
import { useDiagnosticLoss } from "@/lib/roi";
import { Row } from "@/components/calc-row";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation, SERVICE_DETAILS } from "@/components/ProductPresentation";
import { DiretoContractGenerator } from "@/components/DiretoContractGenerator";
import { ProposalActions } from "@/components/ProposalActions";
import { proposalService, type ClosingOffer, type ProposalModel } from "@/lib/proposal";
import { CronogramaImplantacao } from "@/components/CronogramaImplantacao";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { bpoImplantacaoStages, BPO_SETUP_DELIVERABLES } from "@/lib/bpo-cronograma";

export const Route = createFileRoute("/calculadora/bpo")({
  component: CalculadoraBPOPage,
});

type TierKey = "tier1" | "tier2" | "tier3";

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "meeting", label: "Condição de fechamento na reunião", percent: 15 },
];

function CalculadoraBPOPage() {
  const { state } = useDiagnostic();
  const { lossMinMonthly } = useDiagnosticLoss();
  const { data, isLoading, error, refetch } = useBPOPricing();

  const [clientName, setClientName] = useState("");
  const [contasPagarDia, setContasPagarDia] = useState(5);
  const [contasReceberDia, setContasReceberDia] = useState(5);
  const [funcionarios, setFuncionarios] = useState(10);
  const [bancos, setBancos] = useState(2);
  const [discountId, setDiscountId] = useState<string>("none");

  useEffect(() => {
    if (!clientName && state.companyName) setClientName(state.companyName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.companyName]);

  // Contas a Receber é informativo — não entra no total de lançamentos/mês (tier/preço).
  const lancamentosMensais = contasPagarDia * (data?.settings.dias_uteis ?? 22);
  const tier = useMemo(() => {
    const t1 = data?.settings.tier_1_limit ?? 200;
    const t2 = data?.settings.tier_2_limit ?? 500;
    if (lancamentosMensais <= t1) return { key: "tier1" as TierKey, label: `Tier 1 (≤${t1})` };
    if (lancamentosMensais <= t2)
      return { key: "tier2" as TierKey, label: `Tier 2 (${t1 + 1}–${t2})` };
    return { key: "tier3" as TierKey, label: `Tier 3 (>${t2})` };
  }, [lancamentosMensais, data]);

  const pacote =
    data?.packages.find((p) => p.name.toLowerCase() === "controle") ?? data?.packages[0];
  const basePrice = pacote
    ? Number(
        tier.key === "tier1"
          ? pacote.price_tier_1
          : tier.key === "tier2"
            ? pacote.price_tier_2
            : pacote.price_tier_3,
      )
    : 0;
  const valorMensalBPO = basePrice;
  const valorMensalSetup = data?.setup ? Number(data.setup.installment_value) : 0;
  const valorMensalTotal = valorMensalBPO + (data?.setup?.add_to_monthly ? valorMensalSetup : 0);
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;
  const BPO_MINIMUM = 3187;
  const valorComDesconto = Math.max(BPO_MINIMUM, valorMensalTotal * (1 - discount.percent / 100));
  const [showPrices, setShowPrices] = useState(false);
  const [showDireto, setShowDireto] = useState(false);

  // O setup do BPO entra embutido na mensalidade, então a proposta não tem
  // bloco de setup separado.
  const buildProposalModel = (closing?: ClosingOffer): ProposalModel => ({
    client: {
      name: clientName || state.companyName || "Cliente",
      profile: `${funcionarios} funcionários · ${bancos} bancos`,
    },
    services: [
      proposalService("bpo", "BPO Financeiro", valorMensalTotal, {
        notIncluded: SERVICE_DETAILS.bpo.notIncluded,
      }),
    ],
    closing,
  });

  const suggestedClosing: ClosingOffer | undefined =
    discount.percent > 0
      ? { monthly: valorComDesconto, setupTotal: 0, installments: 12 }
      : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/servicos"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs
          items={[{ label: "Serviços", to: "/servicos" }, { label: "BPO Financeiro" }]}
        />

        <div className="mb-8">
          <h1
            className="font-bold tracking-[0.005em]"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            Calculadora — BPO Financeiro
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure os parâmetros para calcular o valor mensal da operação.
          </p>
        </div>

        <LossSummaryPanel />

        <ProductPresentation serviceKey="bpo" title="BPO Financeiro" />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {data && pacote && (
          <>
            <div className="space-y-6 mb-6">
              <CollapsibleSection
                eyebrow="Implantação"
                title="Cronograma de implantação"
                subtitle="Kickoff → Semana 4 · 30 dias"
              >
                <CronogramaImplantacao />
              </CollapsibleSection>

              {data.setup && (
                <CollapsibleSection
                  eyebrow="Benefício"
                  title={data.setup.name}
                  subtitle={`${data.setup.installments} parcelas${data.setup.add_to_monthly ? " — incluído no valor mensal" : ""}`}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Setup — o que inclui
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    {BPO_SETUP_DELIVERABLES.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-primary bg-primary/15 shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
            </div>

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
                      <Input
                        type="number"
                        min={1}
                        value={contasPagarDia}
                        onChange={(e) =>
                          setContasPagarDia(Math.max(1, Number(e.target.value) || 1))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Lançamentos/dia — Contas a Receber{" "}
                        <span className="text-muted-foreground text-xs">(informativo)</span>
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={contasReceberDia}
                        onChange={(e) =>
                          setContasReceberDia(Math.max(1, Number(e.target.value) || 1))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Funcionários{" "}
                        <span className="text-muted-foreground text-xs">(informativo)</span>
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={funcionarios}
                        onChange={(e) => setFuncionarios(Math.max(1, Number(e.target.value) || 1))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Bancos <span className="text-muted-foreground text-xs">(informativo)</span>
                      </Label>
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
                      Lançamentos/mês:{" "}
                      <span className="font-semibold text-foreground">{lancamentosMensais}</span>
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1">{tier.label}</span>
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-7">
                  <button
                    type="button"
                    onClick={() => setDiscountId(discountId === "meeting" ? "none" : "meeting")}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border bg-background p-3 cursor-pointer text-left",
                      discountId === "meeting" ? "border-primary bg-primary/10" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full border-2 shrink-0",
                        discountId === "meeting"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground",
                      )}
                    />
                    <span className="text-sm">Condição de fechamento na reunião</span>
                  </button>
                </section>
              </div>

              <aside className="lg:col-span-1">
                <div
                  className="lg:sticky lg:top-6 rounded-2xl border-2 border-primary bg-card p-7"
                  style={{
                    backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))",
                  }}
                >
                  <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">
                    Proposta
                  </p>
                  <h2 className="text-xl font-bold mt-1">{clientName || "Cliente"}</h2>
                  <dl className="mt-5 space-y-2 text-sm">
                    <Row label="Tier" value={tier.label} />
                    <Row label="Lançamentos/mês" value={String(lancamentosMensais)} />
                  </dl>
                  <div className="my-5 border-t border-border" />
                  {showPrices ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <dl className="space-y-2 text-sm">
                        <Row label="Valor mensal BPO" value={formatBRL(valorMensalBPO)} />
                        {data.setup?.add_to_monthly && (
                          <Row
                            label={`Setup mensal (${data.setup.installments}x no cartão)`}
                            value={formatBRL(valorMensalSetup)}
                          />
                        )}
                        <Row label="Subtotal mensal" value={formatBRL(valorMensalTotal)} bold />
                        <Row label="Desconto aplicado" value={`${discount.percent}%`} />
                      </dl>
                      <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-4">
                        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">
                          Valor final mensal
                        </p>
                        <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                          {formatBRL(valorComDesconto)}
                        </p>
                      </div>
                      <RoiPanel investmentMonthly={valorComDesconto} />
                      <Button
                        onClick={() =>
                          exportCalculatorPDF({
                            service: "BPO Financeiro",
                            clientName: clientName || state.companyName,
                            rows: [
                              ["Tier", tier.label],
                              ["Lançamentos/mês", String(lancamentosMensais)],
                              ["Valor mensal BPO", formatBRL(valorMensalBPO)],
                              ["Setup mensal (no cartão)", formatBRL(valorMensalSetup)],
                              ["Subtotal mensal", formatBRL(valorMensalTotal)],
                              ["Desconto", `${discount.percent}%`],
                            ],
                            scope: SERVICE_DETAILS.bpo.deliverables,
                            scopeIntro: SERVICE_DETAILS.bpo.what,
                            notIncluded: SERVICE_DETAILS.bpo.notIncluded,
                            stages: bpoImplantacaoStages(),
                            stagesTitle: "Setup e cronograma de implantação",
                            finalLabel: "Valor final mensal",
                            finalValue: formatBRL(valorComDesconto),
                            roi: { lossMinMonthly, investmentMonthly: valorComDesconto },
                          })
                        }
                        className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Download className="mr-2 h-4 w-4" /> Exportar PDF
                      </Button>
                      <Button
                        onClick={() => setShowDireto(!showDireto)}
                        className="w-full mt-3 bg-card border border-border text-foreground hover:border-primary/60"
                        variant="outline"
                      >
                        <FileText className="mr-2 h-4 w-4" /> Gerar Contrato
                      </Button>
                      <ProposalActions
                        buildModel={buildProposalModel}
                        suggestedClosing={suggestedClosing}
                        suggestionLabel={discount.label}
                      />
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

            <DiretoContractGenerator
              defaultServico="bpo"
              clientName={clientName || state.companyName}
              valorSetupReais={
                data.setup
                  ? Math.round(
                      Number(data.setup.installment_value) * Number(data.setup.installments),
                    )
                  : 0
              }
              valorMensalReais={Math.round(valorMensalBPO)}
              expanded={showDireto}
              onExpandedChange={setShowDireto}
            />
          </>
        )}
      </div>

      <MobilePriceSummary
        label="Valor final mensal"
        value={formatBRL(valorComDesconto)}
        visible={showPrices}
        onReveal={() => setShowPrices(true)}
      />
    </div>
  );
}
