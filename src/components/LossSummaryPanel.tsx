import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { useDiagnosticConfig } from "@/hooks/use-pricing";
import { useCountUp } from "@/components/calc-ui";
import { buildCostRows, calcGrade, getMaturity, formatBRL } from "@/lib/results-logic";
import { formatDateBR } from "@/lib/format";

export function LossSummaryPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { state } = useDiagnostic();
  const { data: config } = useDiagnosticConfig();
  const [open, setOpen] = useState(defaultOpen);

  const hasData =
    state.companyName.trim().length > 0 && Object.keys(state.answers).length > 0;

  const grade = useMemo(() => calcGrade(state.overallScore), [state.overallScore]);
  const maturity = useMemo(
    () => getMaturity(state.overallScore, config?.maturity),
    [state.overallScore, config],
  );
  const rows = useMemo(
    () => buildCostRows(state.answers, state.monthlyRevenue, config?.costs),
    [state.answers, state.monthlyRevenue, config],
  );

  const countUpGrade = useCountUp(grade, 700);

  if (!hasData) return null;

  const pct = Math.max(0, Math.min(100, (grade / 10) * 100));
  const radius = 70;
  const circumference = Math.PI * radius;
  const dash = (pct / 100) * circumference;

  const totalMin = rows.reduce((s, r) => s + r.min, 0);
  const totalMax = rows.reduce((s, r) => s + r.max, 0);
  const hasQuant = rows.some((r) => !r.qualitative);

  return (
    <div
      className="rounded-2xl border bg-card overflow-hidden mb-8"
      style={{ borderColor: "color-mix(in oklab, var(--color-critical) 50%, var(--color-border))" }}
    >
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Empresa</p>
          <h2 className="text-2xl font-bold mt-0.5">{state.companyName}</h2>
          {state.monthlyRevenue > 0 && (
            <p className="text-sm text-muted-foreground">
              Faturamento: {formatBRL(state.monthlyRevenue)}/mês · Diagnóstico de {formatDateBR(state.date)}
            </p>
          )}
          <div
            className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2"
            style={{
              borderColor: maturity.cssVar,
              backgroundColor: `color-mix(in oklab, ${maturity.cssVar} 14%, transparent)`,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: maturity.cssVar }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: maturity.cssVar }}>
                {maturity.label}
              </p>
              <p className="text-xs text-muted-foreground">{maturity.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center shrink-0">
          <svg width="170" height="100" viewBox="0 0 170 100">
            <path
              d="M 15 85 A 70 70 0 0 1 155 85"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 15 85 A 70 70 0 0 1 155 85"
              fill="none"
              stroke={maturity.cssVar}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: "stroke-dasharray 600ms ease" }}
            />
          </svg>
          <div className="-mt-9 text-center">
            <p className="text-4xl font-bold" style={{ color: maturity.cssVar }}>
              {countUpGrade.toFixed(0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Nota de 0 a 10</p>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-2 border-t px-6 py-3 text-sm font-medium text-[var(--color-critical)] hover:bg-[color-mix(in_oklab,var(--color-critical)_8%,transparent)] transition-colors"
          style={{ borderColor: "color-mix(in oklab, var(--color-critical) 30%, var(--color-border))" }}
        >
          <AlertTriangle className="h-4 w-4" />
          {open ? "Ocultar estimativa de perdas" : "Ver estimativa de perdas mensais"}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}

      {open && rows.length > 0 && (
        <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
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
              {hasQuant && (
                <>
                  <tr className="border-t border-border">
                    <td className="pt-4 font-semibold">Total de perdas mensais</td>
                    <td className="pt-4 text-right font-bold text-[var(--color-critical)]">
                      {formatBRL(totalMin)} — {formatBRL(totalMax)}
                    </td>
                  </tr>
                  <tr>
                    <td className="pt-2 pb-1 font-semibold">Total de perdas anuais</td>
                    <td className="pt-2 pb-1 text-right font-bold text-[var(--color-critical)] text-lg">
                      {formatBRL(totalMin * 12)} — {formatBRL(totalMax * 12)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
