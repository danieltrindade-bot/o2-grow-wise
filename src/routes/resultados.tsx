import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import { exportDiagnosticPDF } from "@/lib/pdf-export";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useCountUp } from "@/components/calc-ui";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { useDiagnosticConfig } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton, ErrorState } from "@/components/calc-ui";
import { Button } from "@/components/ui/button";
import {
  buildAlerts,
  buildCostRows,
  calcGrade,
  formatBRL,
  getMaturity,
  type CostRow,
  type AlertItem,
  type Maturity,
} from "@/lib/results-logic";
import { formatDateBR } from "@/lib/format";

export const Route = createFileRoute("/resultados")({
  component: ResultadosPage,
});

function ResultadosPage() {
  const { state, reset } = useDiagnostic();
  const navigate = useNavigate();
  const { data: config, isLoading, error, refetch } = useDiagnosticConfig();

  const hasData =
    state.companyName.trim().length > 0 &&
    Object.keys(state.answers).length > 0;

  const grade = useMemo(() => calcGrade(state.overallScore), [state.overallScore]);
  const maturity = useMemo(
    () => getMaturity(state.overallScore, config?.maturity),
    [state.overallScore, config],
  );
  const costRows = useMemo(
    () => buildCostRows(state.answers, state.monthlyRevenue, config?.costs),
    [state.answers, state.monthlyRevenue, config],
  );
  const alerts = useMemo(
    () => buildAlerts(state.answers, config?.questions),
    [state.answers, config],
  );

  const handleExportPDF = () => {
    const totalMin = costRows.reduce((s, r) => s + r.min, 0);
    const totalMax = costRows.reduce((s, r) => s + r.max, 0);
    const hasQuant = costRows.some((r) => !r.qualitative);
    exportDiagnosticPDF({
      companyName: state.companyName,
      consultantName: state.consultantName,
      date: formatDateBR(state.date),
      grade,
      maturityLabel: maturity.label,
      maturityDescription: maturity.description,
      costRows: costRows.map((r) => ({
        label: r.label,
        value: r.qualitative
          ? "Estimar após diagnóstico completo"
          : `${formatBRL(r.min)} — ${formatBRL(r.max)}`,
      })),
      costTotal: hasQuant ? `${formatBRL(totalMin)} — ${formatBRL(totalMax)}` : undefined,
      outcomeRows: [],
      recommendation: { service: "", tagline: "" },
    });
  };

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background text-foreground px-4 py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <h2 className="text-xl font-semibold">Nenhum diagnóstico em andamento</h2>
          <p className="text-muted-foreground">Inicie um novo diagnóstico ou acesse o histórico de reuniões.</p>
          <div className="flex gap-3">
            <Link to="/diagnostico"><Button>Novo Diagnóstico</Button></Link>
            <Link to="/reunioes"><Button variant="outline">Histórico de Reuniões</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <Breadcrumbs items={[{ label: "Diagnóstico", to: "/diagnostico" }, { label: "Resultados" }]} />

        {isLoading && <CalcLoadingSkeleton />}
        {error && <ErrorState error={error} retry={() => refetch()} />}

        {!isLoading && !error && (
          <>
            <ScoreSummary
              companyName={state.companyName}
              monthlyRevenue={state.monthlyRevenue}
              date={formatDateBR(state.date)}
              grade={grade}
              maturity={maturity}
            />
            <CostTable rows={costRows} />
            <AlertPills items={alerts} />

            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="mr-2 h-4 w-4" /> Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => { reset(); navigate({ to: "/diagnostico" }); }}>
                <RefreshCw className="mr-2 h-4 w-4" /> Novo Diagnóstico
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreSummary({
  companyName,
  monthlyRevenue,
  date,
  grade,
  maturity,
}: {
  companyName: string;
  monthlyRevenue: number;
  date: string;
  grade: number;
  maturity: Maturity;
}) {
  // Semicircular gauge: grade 0-10 → 0-100%
  const pct = Math.max(0, Math.min(100, (grade / 10) * 100));
  const radius = 90;
  const circumference = Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Empresa</p>
          <h1 className="text-3xl font-bold mt-1">{companyName}</h1>
          {monthlyRevenue > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Faturamento: {formatBRL(monthlyRevenue)}/mês
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">Diagnóstico de {date}</p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border px-4 py-3"
               style={{ borderColor: maturity.cssVar, backgroundColor: `color-mix(in oklab, ${maturity.cssVar} 14%, transparent)` }}>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: maturity.cssVar }}
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: maturity.cssVar }}>
                {maturity.label}
              </p>
              <p className="text-xs text-muted-foreground">{maturity.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <svg width="220" height="130" viewBox="0 0 220 130">
            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke={maturity.cssVar}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 600ms ease" }}
            />
          </svg>
          <div className="-mt-12 text-center">
            <p className="text-5xl font-bold" style={{ color: maturity.cssVar }}>
              {useCountUp(grade, 700).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Nota de 0 a 10</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostTable({ rows }: { rows: CostRow[] }) {
  const totalMin = rows.reduce((s, r) => s + r.min, 0);
  const totalMax = rows.reduce((s, r) => s + r.max, 0);
  const hasQuantitative = rows.some((r) => !r.qualitative);

  return (
    <div className="rounded-2xl border bg-card p-6"
         style={{ borderColor: "color-mix(in oklab, var(--color-critical) 50%, var(--color-border))" }}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-[var(--color-critical)]" />
        <h2 className="text-xl font-semibold">Estimativa de Perdas Mensais</h2>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma perda significativa identificada nas respostas atuais.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Problema identificado</th>
                  <th className="py-2 font-medium text-right">Estimativa mensal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.questionId + r.label} className="border-b border-border/60">
                    <td className="py-3 pr-4">{r.label}</td>
                    <td className="py-3 text-right font-medium">
                      {r.qualitative
                        ? "Estimar após diagnóstico completo"
                        : `${formatBRL(r.min)} — ${formatBRL(r.max)}`}
                    </td>
                  </tr>
                ))}
                {hasQuantitative && (
                  <>
                    <tr className="border-t border-border">
                      <td className="pt-4 font-semibold">Estimativa total de perdas mensais</td>
                      <td className="pt-4 text-right font-bold text-[var(--color-critical)]">
                        {formatBRL(totalMin)} — {formatBRL(totalMax)}
                      </td>
                    </tr>
                    <tr>
                      <td className="pt-2 pb-1 font-semibold">Estimativa total de perdas anuais</td>
                      <td className="pt-2 pb-1 text-right font-bold text-[var(--color-critical)] text-lg">
                        {formatBRL(totalMin * 12)} — {formatBRL(totalMax * 12)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-0.5 text-[10px] leading-relaxed text-muted-foreground/70">
            <p>Estimativas baseadas em benchmarks de PMEs com faturamento entre R$ 300 mil e R$ 3 milhões/mês.</p>
            <p><sup>1</sup> Considerando 1% a 2% do faturamento mensal em recebíveis sem acompanhamento adequado.</p>
            <p><sup>2</sup> Considerando 1,5% a 2,5% do faturamento mensal em inadimplência sem régua de cobrança ativa.</p>
            <p><sup>3</sup> Pesquisas de procurement indicam economia média de 10% a 15% com processo de cotação estruturado.</p>
            <p><sup>4</sup> Custo de antecipação de recebíveis calculado sobre 50% do faturamento (estimativa conservadora), com taxa de 2% a 4%.</p>
            <p><sup>5</sup> Custo de crédito emergencial estimado entre 1% e 2,5% do faturamento por descasamento entre vendas e caixa.</p>
            <p><sup>6</sup> Fonte: ACFE — Association of Certified Fraud Examiners, Report to the Nations 2022.</p>
          </div>
        </>
      )}
    </div>
  );
}

function AlertPills({ items }: { items: AlertItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
        Pontos de atenção
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const color =
            it.level === "red" ? "var(--color-critical)" : "var(--color-warning)";
          return (
            <span
              key={it.questionId}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: color,
                color,
                backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              {it.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
