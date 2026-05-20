import { cn } from "@/lib/utils";

export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold && "font-semibold")}>{value}</span>
    </div>
  );
}
