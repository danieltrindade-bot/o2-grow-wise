import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Pencil,
  Sparkles,
  Download,
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
  buildOutcomeRows,
  calcGrade,
  formatBRL,
  getMaturity,
  getRecommendation,
  type CostRow,
  type AlertItem,
  type OutcomeRow,
  type Recommendation,
  type Maturity,
} from "@/lib/results-logic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/resultados")({
  component: ResultadosPage,
});

function formatDateBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function ResultadosPage() {
  const { state, goTo, reset } = useDiagnostic();
  const navigate = useNavigate();
  const { data: config, isLoading, error, refetch } = useDiagnosticConfig();

  const hasData =
    state.companyName.trim().length > 0 &&
    Object.keys(state.answers).length > 0;

  useEffect(() => {
    if (!hasData) navigate({ to: "/diagnostico" });
  }, [hasData, navigate]);

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
  const outcomes = useMemo(
    () => buildOutcomeRows(state.answers, config?.outcomes),
    [state.answers, config],
  );
  const recommendation = useMemo(
    () => getRecommendation(state.overallScore, state.answers, config?.recommendations, config?.questions),
    [state.overallScore, state.answers, config],
  );

  const handleEdit = () => {
    goTo(3);
    navigate({ to: "/diagnostico" });
  };
  const handleNew = () => {
    reset();
    navigate({ to: "/diagnostico" });
  };

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
      outcomeRows: outcomes.map((o) => ({ current: o.current, future: o.future })),
      recommendation: { service: recommendation.service, tagline: recommendation.tagline },
    });
  };

  if (!hasData) return null;

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
              date={formatDateBR(state.date)}
              grade={grade}
              maturity={maturity}
            />
            <CostTable rows={costRows} />
            <AlertPills items={alerts} />
            <OutcomesTable rows={outcomes} />
            <RecommendationCard rec={recommendation} />

            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4">
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Editar Respostas
              </Button>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleNew}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Nova Reunião
                </Button>
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" /> Exportar PDF
                </Button>
                <Button
                  onClick={() => navigate({ to: "/servicos" })}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Ver Serviços e Precificar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreSummary({
  companyName,
  date,
  grade,
  maturity,
}: {
  companyName: string;
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
              {grade}
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 font-medium">Gap Identificado</th>
                <th className="py-2 font-medium text-right">Estimativa Mensal</th>
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
                <tr>
                  <td className="pt-4 font-semibold">Total estimado</td>
                  <td className="pt-4 text-right font-bold text-[var(--color-critical)]">
                    {formatBRL(totalMin)} — {formatBRL(totalMax)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

function OutcomesTable({ rows }: { rows: OutcomeRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">O que muda em 90 dias</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2 font-medium w-[45%]">Situação Atual</th>
              <th className="py-2 font-medium w-[10%]"></th>
              <th className="py-2 font-medium w-[45%]">Em 90 dias com a O2</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.questionId} className="border-b border-border/60 align-top">
                <td className="py-3 pr-4 text-muted-foreground">{r.current}</td>
                <td className="py-3 text-center">
                  <ArrowRight className="h-4 w-4 mx-auto text-primary" />
                </td>
                <td className="py-3 pl-4">{r.future}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-6 bg-card",
        "border-[var(--color-primary)]",
      )}
      style={{
        backgroundColor: "color-mix(in oklab, var(--color-primary) 8%, var(--card))",
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-lg bg-primary/15 p-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-primary">Recomendação</p>
          <h2 className="text-2xl font-bold mt-1">{rec.service}</h2>
          <p className="text-sm text-muted-foreground mt-1">{rec.tagline}</p>
        </div>
      </div>

      {rec.gaps.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Resolve os seguintes gaps
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rec.gaps.map((g) => (
              <li key={g} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
