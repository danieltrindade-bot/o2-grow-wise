import { BPO_CRONOGRAMA, BPO_CRONOGRAMA_INTRO } from "@/lib/bpo-cronograma";

export function CronogramaImplantacao() {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        <span className="text-primary font-semibold">30 dias</span> {BPO_CRONOGRAMA_INTRO.replace("Implantação em 30 dias ", "")}
      </p>

      <div className="mt-4 h-0.5 rounded bg-gradient-to-r from-primary to-primary/20 mx-1" />

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {BPO_CRONOGRAMA.map((etapa) => (
          <div key={etapa.label} className="relative rounded-xl border border-border bg-background/50 p-4">
            <span className="absolute -top-1.5 left-4 h-3 w-3 rounded-full bg-primary ring-4 ring-card" />
            <p className="font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-primary">{etapa.label}</p>
            <p className="mt-1 text-[15px] font-bold leading-tight text-foreground text-balance">{etapa.title}</p>
            <ul className="mt-2.5 space-y-1.5">
              {etapa.items.map((item) => (
                <li key={item} className="text-[13px] leading-snug text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/40 bg-primary/10 p-3.5 text-sm leading-relaxed text-foreground/90">
        <span>
          <strong className="text-primary">Depois:</strong> operação recorrente — execução disciplinada das rotinas,
          atualização das informações e acompanhamento contínuo.
        </span>
      </div>
    </div>
  );
}
