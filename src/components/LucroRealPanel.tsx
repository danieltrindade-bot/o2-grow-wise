import { useState } from "react";
import { Landmark, ChevronDown } from "lucide-react";
import { formatBRL } from "@/lib/format";

export const LUCRO_REAL_RATE = 0.34;

export interface LucroRealItem {
  label: string;
  value: number;
}

export function lucroRealNet(value: number): number {
  return value * (1 - LUCRO_REAL_RATE);
}

const ROW = "grid grid-cols-[minmax(0,1fr)_6rem_6rem] gap-x-2 px-3 py-2 tabular-nums";
const NUM = "whitespace-nowrap text-right";

interface LucroRealPanelProps {
  /** Parcelas que somam o valor cobrado no período (sem repetir valores). */
  items: LucroRealItem[];
  suffix?: string;
  /** Total do projeto exibido só como referência, fora da soma. */
  projectTotal?: number;
}

export function LucroRealPanel({ items, suffix = "", projectTotal }: LucroRealPanelProps) {
  const [open, setOpen] = useState(false);
  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (total <= 0) return null;

  const benefit = total * LUCRO_REAL_RATE;
  const pctNet = Math.round((1 - LUCRO_REAL_RATE) * 100);
  const pctRate = Math.round(LUCRO_REAL_RATE * 100);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-primary/60 bg-background/60 px-4 py-3 text-left text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Landmark className="h-4 w-4" /> Sua empresa é do Lucro Real?
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-primary bg-primary/10 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-base font-bold leading-snug">
            Você paga {formatBRL(total)}
            {suffix}. A O2 custa{" "}
            <span className="text-primary">
              {formatBRL(lucroRealNet(total))}
              {suffix}
            </span>
            .
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            No Lucro Real, de cada R$ 100 investidos na O2, R$ {pctRate} voltam em imposto que você
            deixa de pagar.
          </p>

          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card text-xs">
            <div className={`${ROW} border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground`}>
              <span />
              <span className={NUM}>Presumido</span>
              <span className={`${NUM} text-primary`}>Lucro Real</span>
            </div>
            {items.map((item) => (
              <div key={item.label} className={`${ROW} border-b border-border`}>
                <span className="text-muted-foreground">{item.label}</span>
                <span className={NUM}>{formatBRL(item.value)}</span>
                <span className={NUM}>{formatBRL(item.value)}</span>
              </div>
            ))}
            <div className={`${ROW} border-b border-border`}>
              <span className="text-muted-foreground">IRPJ/CSLL ({pctRate}%)</span>
              <span className={NUM}>{formatBRL(0)}</span>
              <span className={`${NUM} text-primary`}>({formatBRL(benefit)})</span>
            </div>
            <div className={`${ROW} border-b border-border font-bold`}>
              <span>Custo real{suffix}</span>
              <span className={NUM}>{formatBRL(total)}</span>
              <span className={`${NUM} text-primary`}>{formatBRL(total - benefit)}</span>
            </div>
            <div className={`${ROW} bg-muted/40 font-mono text-[10px] uppercase tracking-wider`}>
              <span className="text-muted-foreground">% do cobrado</span>
              <span className={NUM}>100%</span>
              <span className={`${NUM} text-primary font-bold`}>{pctNet}%</span>
            </div>
          </div>

          {projectTotal != null && projectTotal > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Valor total do projeto: {formatBRL(projectTotal)}. No Lucro Real, custo real de{" "}
              <span className="font-medium text-primary">{formatBRL(lucroRealNet(projectTotal))}</span>.
            </p>
          )}

          <p className="mt-2 text-[9px] leading-tight text-muted-foreground/70">
            Estimativa: IRPJ 25% + CSLL 9% sobre despesa dedutível. O benefício só se realiza se a
            empresa tiver lucro tributável no período. Não considera créditos de PIS/Cofins ou ICMS.
          </p>
        </div>
      )}
    </div>
  );
}
