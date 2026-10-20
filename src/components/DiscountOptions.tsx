import { cn } from "@/lib/utils";

export interface DiscountOption {
  id: string;
  label: string;
  percent: number;
}

interface DiscountOptionsProps {
  options: DiscountOption[];
  value: string;
  onChange: (id: string) => void;
}

/** Botões de condição de desconto. Clicar no ativo volta para "none". */
export function DiscountOptions({ options, value, onChange }: DiscountOptionsProps) {
  return (
    <div className="space-y-2">
      {options
        .filter((o) => o.percent > 0)
        .map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(active ? "none" : o.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border bg-background p-3 cursor-pointer text-left",
                active ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              <span
                className={cn(
                  "h-4 w-4 rounded-full border-2 shrink-0",
                  active ? "border-primary bg-primary" : "border-muted-foreground",
                )}
              />
              <span className="text-sm">{o.label}</span>
            </button>
          );
        })}
    </div>
  );
}
