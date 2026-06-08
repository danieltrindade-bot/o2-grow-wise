import { TrendingUp, Percent, PiggyBank, Clock } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { computeRoi, useDiagnosticLoss, ROI_CONSERVATIVE_FACTOR } from "@/lib/roi";

export function RoiPanel({ investmentMonthly }: { investmentMonthly: number }) {
  const { hasData, lossMinMonthly } = useDiagnosticLoss();
  if (!hasData) return null;

  const roi = computeRoi(lossMinMonthly, investmentMonthly);
  if (!roi) return null;

  const pct = Math.round(ROI_CONSERVATIVE_FACTOR * 100);

  return (
    <div className="mt-5 rounded-xl border border-[var(--color-success)] bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] p-4">
      <div className="flex items-center gap-2 text-[var(--color-success)] text-xs uppercase tracking-wider">
        <TrendingUp className="h-4 w-4" /> Retorno sobre o investimento
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        Cenário conservador — considera apenas {pct}% da menor perda estimada no diagnóstico.
      </p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Perda evitável/ano</dt>
          <dd className="font-medium tabular-nums">{formatBRL(roi.recoverableAnnual)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Investimento/ano</dt>
          <dd className="font-medium tabular-nums">{formatBRL(roi.investmentAnnual)}</dd>
        </div>
      </dl>

      {roi.positive && (
        <div className="mt-3 rounded-lg bg-[color-mix(in_oklab,var(--color-success)_16%,transparent)] border border-[var(--color-success)] p-3">
          <div className="flex items-center gap-2 text-[var(--color-success)] text-[11px] uppercase tracking-wider">
            <PiggyBank className="h-3.5 w-3.5" /> Economia líquida/ano
          </div>
          <p className="text-2xl font-bold text-[var(--color-success)] mt-0.5 tabular-nums">
            {formatBRL(roi.netAnnual)}
          </p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-card border border-border p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
            <Clock className="h-3 w-3" /> Tempo de retorno
          </div>
          <p className="font-bold mt-0.5 tabular-nums">
            {roi.paybackMonths < 1
              ? "menos de 1 mês"
              : `~${Math.round(roi.paybackMonths)} ${Math.round(roi.paybackMonths) === 1 ? "mês" : "meses"}`}
          </p>
        </div>
        <div className="rounded-lg bg-card border border-border p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider">
            <Percent className="h-3 w-3" /> Retorno anual
          </div>
          <p className="font-bold mt-0.5 tabular-nums">
            {roi.positive ? "+" : ""}{Math.round((roi.multiple - 1) * 100)}%
          </p>
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <TrendingUp className="h-3 w-3 shrink-0" />
        Cada R$ 1 investido evita {formatBRL(roi.multiple)} em perdas.
      </p>
    </div>
  );
}
