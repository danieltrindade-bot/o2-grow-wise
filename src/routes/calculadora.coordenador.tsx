import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download, FileText } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { calcSetupPriceFromRules, perfilFromInputs, coordComplexidade, COORD_MENSAL, COORD_MENSAL_MINIMUM, COORD_NIVEL_LABEL, formatBRL, type CoordPerfil, type SegmentType } from "@/lib/pricing-shared";
import { useCoordenadorPricing } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState } from "@/components/calc-ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LossSummaryPanel } from "@/components/LossSummaryPanel";
import { RoiPanel } from "@/components/RoiPanel";
import { useDiagnosticLoss } from "@/lib/roi";
import { Row } from "@/components/calc-row";
import { InfoTooltip, TOOLTIPS } from "@/components/InfoTooltip";
import { MobilePriceSummary } from "@/components/MobilePriceSummary";
import { ProductPresentation } from "@/components/ProductPresentation";
import { exportCalculatorPDF } from "@/lib/pdf-export";
import { ContractGenerator } from "@/components/ContractGenerator";
import { DiretoContractGenerator } from "@/components/DiretoContractGenerator";

export const Route = createFileRoute("/calculadora/coordenador")({
  component: CoordenadorPage,
});

const DISCOUNTS = [
  { id: "none", label: "Sem desconto", percent: 0 },
  { id: "d7", label: "Pagamento em 7 dias", percent: 7 },
  { id: "meeting", label: "Fechamento em reunião", percent: 15 },
];

const PERFIS: { id: CoordPerfil; label: string; desc: string }[] = [
  { id: "essencial", label: "Essencial", desc: "Até 3 colab. · 1 CNPJ · só Financeiro" },
  { id: "estruturado", label: "Estruturado", desc: "4–8 colab. · 1–2 CNPJs · Financeiro + 1 departamento" },
  { id: "integrado", label: "Integrado", desc: "9+ colab. · Multi-CNPJ · Financeiro + Compras + Faturamento" },
];

const INCLUDES = [
  "Coordenador financeiro dedicado",
  "Gestão de equipe financeira",
  "Processos e controles",
  "Reporte executivo",
];

const FUNC_TOOLTIP =
  "Colaboradores envolvidos na operação financeira. Junto com os CNPJs, define o perfil de valor.";
const CNPJ_TOOLTIP =
  "Quantidade de CNPJs/empresas atendidas. Junto com o nº de funcionários, define o perfil de valor.";

function CoordenadorPage() {
  const { state } = useDiagnostic();
  const { lossMinMonthly } = useDiagnosticLoss();
  const { data, isLoading, error, refetch } = useCoordenadorPricing();

  const [employees, setEmployees] = useState(1);
  const [cnpjCount, setCnpjCount] = useState(1);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [segmentType, setSegmentType] = useState<SegmentType>("mesmo");
  const [discountId, setDiscountId] = useState("none");
  const [showPrices, setShowPrices] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showDireto, setShowDireto] = useState(false);

  useEffect(() => {
    if (monthlyRevenue === 0 && state.monthlyRevenue > 0) setMonthlyRevenue(state.monthlyRevenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.monthlyRevenue]);

  useEffect(() => {
    if (cnpjCount === 1 && segmentType !== "mesmo") setSegmentType("mesmo");
  }, [cnpjCount, segmentType]);

  const perfil = perfilFromInputs(employees, cnpjCount);
  const perfilInfo = PERFIS.find((p) => p.id === perfil)!;
  const discount = DISCOUNTS.find((d) => d.id === discountId)!;

  const complexidade = coordComplexidade(cnpjCount, monthlyRevenue);
  const fase2 = COORD_MENSAL[perfil][complexidade.nivel];
  const setupRes = data
    ? calcSetupPriceFromRules(data, monthlyRevenue, cnpjCount, segmentType)
    : { classification: "padrao" as const, base: 0, surcharge: 0, total: 0 };

  const setupComDesconto = setupRes.total * (1 - discount.percent / 100);
  const parcela12x = setupComDesconto / 12;
  const mensalComDesconto = Math.max(COORD_MENSAL_MINIMUM, fase2 * (1 - discount.percent / 100));

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 pb-20 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/servicos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Serviços
        </Link>
        <Breadcrumbs items={[{ label: "Serviços", to: "/servicos" }, { label: "Coordenador as a Service" }]} />
        <div className="mb-8">
          <h1 className="font-bold tracking-[0.005em]" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>Coordenador as a Service</h1>
        </div>

        <ProductPresentation serviceKey="coordenador" title="Coordenador as a Service" />

        <LossSummaryPanel />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {data && (<>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-7 space-y-4">
              <h2 className="text-lg font-semibold">Parâmetros</h2>
              <div className="space-y-2">
                <Label>Faturamento mensal</Label>
                <CurrencyInput value={monthlyRevenue} onValueChange={setMonthlyRevenue} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Número de funcionários <InfoTooltip text={FUNC_TOOLTIP} />
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={employees}
                  onChange={(e) => setEmployees(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Quantidade de CNPJs <InfoTooltip text={CNPJ_TOOLTIP} />
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
                <Select value={segmentType} onValueChange={(v) => setSegmentType(v as SegmentType)} disabled={cnpjCount === 1}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mesmo">Mesmo segmento</SelectItem>
                    <SelectItem value="correlato">Correlato</SelectItem>
                    <SelectItem value="diferente">Diferente</SelectItem>
                    <SelectItem value="muito_diferente">Muito diferente</SelectItem>
                  </SelectContent>
                </Select>
                {cnpjCount === 1 && <p className="text-xs text-muted-foreground">Disponível com 2+ CNPJs</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-primary/10 border border-primary/40 p-3">
                  <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Perfil de valor</p>
                  <p className="text-base font-semibold mt-0.5">{perfilInfo.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{perfilInfo.desc}</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-3">
                  <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">Complexidade</p>
                  <p className="text-base font-semibold mt-0.5">{COORD_NIVEL_LABEL[complexidade.nivel]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {complexidade.reasons.length ? complexidade.reasons.join(" · ") : "1 CNPJ · faturamento < R$ 500k/mês"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-7">
              <h2 className="text-lg font-semibold mb-4">Desconto</h2>
              <p className="text-xs text-muted-foreground mb-3">Aplicado à mensalidade (recorrência) e ao setup.</p>
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

          <aside className="rounded-2xl border-2 border-primary bg-card p-7"
                 style={{ backgroundColor: "color-mix(in oklab, var(--color-primary) 6%, var(--card))" }}>
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Investimento</p>
            {showPrices ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Row label="Perfil" value={perfilInfo.label} />
                <Row label="Setup (valor único)" value={formatBRL(setupComDesconto)} bold />

                <div className="mt-5 rounded-xl bg-primary/15 border border-primary p-5">
                  <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Setup · 12x no cartão</p>
                  <p className="text-3xl md:text-4xl font-bold text-primary mt-1 tabular-nums">
                    {formatBRL(parcela12x)}<span className="text-sm font-normal text-primary/70">/mês</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor total: {formatBRL(setupComDesconto)}
                  </p>
                </div>

                <div className="mt-3 rounded-xl bg-card border border-border p-5">
                  <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">Mensalidade · recorrência</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 tabular-nums">
                    {formatBRL(mensalComDesconto)}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  {discount.percent > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Desconto {discount.percent}%: -{formatBRL(fase2 - mensalComDesconto)}/mês (de {formatBRL(fase2)})
                    </p>
                  )}
                </div>

                <RoiPanel investmentMonthly={mensalComDesconto + parcela12x} />

                <div className="mt-5">
                  <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground mb-2">Inclui</p>
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
                      monthlyRevenue,
                      rows: [
                        ["Perfil", perfilInfo.label],
                        ["Complexidade", COORD_NIVEL_LABEL[complexidade.nivel]],
                        ["Funcionários", String(employees)],
                        ["CNPJs", String(cnpjCount)],
                        ["Setup (valor único)", formatBRL(setupComDesconto)],
                        ["Setup (12x)", formatBRL(parcela12x)],
                        ...(discount.percent > 0
                          ? [[`Desconto (${discount.percent}%)`, `-${formatBRL(fase2 - mensalComDesconto)}/mês`] as [string, string]]
                          : []),
                        ["Mensalidade", formatBRL(mensalComDesconto)],
                      ],
                      finalLabel: "Mensalidade",
                      finalValue: formatBRL(mensalComDesconto),
                      roi: { lossMinMonthly, investmentMonthly: mensalComDesconto + parcela12x },
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
                <Row label="Perfil" value={perfilInfo.label} />
                <div className="mt-5">
                  <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground mb-2">Inclui</p>
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
          modelo="Coordenador as a Service"
          valorSetup={String(Math.round(setupComDesconto * 100))}
          valorMensal={String(Math.round(mensalComDesconto * 100))}
          qtdParcelasSetup={12}
          expanded={showContract}
          onExpandedChange={setShowContract}
        />

        <DiretoContractGenerator
          defaultServico="coordenador"
          clientName={state.companyName}
          valorSetupReais={Math.round(setupComDesconto)}
          valorMensalReais={Math.round(mensalComDesconto)}
          expanded={showDireto}
          onExpandedChange={setShowDireto}
        />
        </>)}
      </div>

      <MobilePriceSummary label="Mensalidade" value={formatBRL(mensalComDesconto)} visible={showPrices} onReveal={() => setShowPrices(true)} />
    </div>
  );
}
