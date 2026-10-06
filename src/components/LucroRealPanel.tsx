import { useState } from "react";
import { Landmark, ChevronDown } from "lucide-react";
import { formatBRL } from "@/lib/format";

export const LUCRO_REAL_RATE = 0.34;

export interface LucroRealLine {
  label: string;
  value: number;
  suffix?: string;
}

export function lucroRealNet(value: number): number {
  return value * (1 - LUCRO_REAL_RATE);
}

export function LucroRealPanel({ lines }: { lines: LucroRealLine[] }) {
  const [open, setOpen] = useState(false);
  const main = lines[0];
  if (!main || main.value <= 0) return null;

  const pctNet = Math.round((1 - LUCRO_REAL_RATE) * 100);
  const pctRate = Math.round(LUCRO_REAL_RATE * 100);
  const suffix = main.suffix ?? "";

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
            Você paga {formatBRL(main.value)}
            {suffix}. A O2 custa{" "}
            <span className="text-primary">
              {formatBRL(lucroRealNet(main.value))}
              {suffix}
            </span>
            .
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            No Lucro Real, de cada R$ 100 investidos na O2, R$ {pctRate} voltam em imposto que você
            deixa de pagar.
          </p>

          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card text-xs">
            <div className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] gap-x-2 border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span />
              <span className="whitespace-nowrap text-right">Presumido</span>
              <span className="whitespace-nowrap text-right text-primary">Lucro Real</span>
            </div>
            {lines.map((line) => {
              const benefit = line.value * LUCRO_REAL_RATE;
              return (
                <div key={line.label} className="border-b border-border last:border-b-0 px-3 py-2 space-y-1">
                  <p className="font-medium">{line.label}</p>
                  <div className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] gap-x-2 tabular-nums">
                    <span className="text-muted-foreground">Cobrado</span>
                    <span className="whitespace-nowrap text-right">{formatBRL(line.value)}</span>
                    <span className="whitespace-nowrap text-right">{formatBRL(line.value)}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] gap-x-2 tabular-nums">
                    <span className="text-muted-foreground">IRPJ/CSLL</span>
                    <span className="whitespace-nowrap text-right">{formatBRL(0)}</span>
                    <span className="whitespace-nowrap text-right text-primary">({formatBRL(benefit)})</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] gap-x-2 tabular-nums font-bold">
                    <span>Custo real</span>
                    <span className="whitespace-nowrap text-right">{formatBRL(line.value)}</span>
                    <span className="whitespace-nowrap text-right text-primary">{formatBRL(line.value - benefit)}</span>
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] gap-x-2 bg-muted/40 px-3 py-2 font-mono text-[10px] uppercase tracking-wider">
              <span className="text-muted-foreground">% do cobrado</span>
              <span className="whitespace-nowrap text-right">100%</span>
              <span className="whitespace-nowrap text-right text-primary font-bold">{pctNet}%</span>
            </div>
          </div>

          <p className="mt-2 text-[9px] leading-tight text-muted-foreground/70">
            Estimativa: IRPJ 25% + CSLL 9% sobre despesa dedutível. O benefício só se realiza se a
            empresa tiver lucro tributável no período. Não considera créditos de PIS/Cofins ou ICMS.
          </p>
        </div>
      )}
    </div>
  );
}
