import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({ eyebrow, title, subtitle, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={cn("rounded-2xl border bg-card overflow-hidden transition-colors", open ? "border-primary/60" : "border-border")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-4 p-7 text-left hover:bg-primary/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          {eyebrow && <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">{eyebrow}</p>}
          <h2 className="text-lg font-semibold mt-1">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-200 ease-in-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="px-7 pb-7 pt-1 border-t border-border">{children}</div>
        </div>
      </div>
    </section>
  );
}
