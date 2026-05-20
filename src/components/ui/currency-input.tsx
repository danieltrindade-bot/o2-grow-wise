import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number;
  onValueChange: (value: number) => void;
}

function formatCents(cents: number): string {
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const cents = Math.round((value || 0) * 100);
    const display = `R$ ${formatCents(cents)}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      const newCents = digits ? parseInt(digits, 10) : 0;
      onValueChange(newCents / 100);
    };

    return (
      <input
        type="text"
        inputMode="numeric"
        ref={ref}
        value={display}
        onChange={handleChange}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
