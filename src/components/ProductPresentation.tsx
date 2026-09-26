"use client";

import { useState } from "react";
import { Check, ChevronDown, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_DETAILS, type ScopePillar, type ScopeNote, type ServiceDetail } from "@/lib/service-scopes";
import { SCOPE_HTML_KEYS, ScopeFrame } from "./ScopeFrame";

export { SERVICE_DETAILS };
export type { ServiceDetail };

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{children}</p>;
}

function NoteBox({ note }: { note: ScopeNote }) {
  return (
    <div className="rounded-xl bg-background/50 border border-border p-4">
      <p className="text-xs uppercase tracking-wider text-primary mb-1">{note.title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{note.text}</p>
    </div>
  );
}

function PillarCard({ pillar, index }: { pillar: ScopePillar; index: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="font-semibold text-sm leading-tight mt-3">{pillar.title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{pillar.subtitle}</p>
      <ul className="mt-3 space-y-2">
        {pillar.items.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-sm leading-snug">
              {item.label}
              <span className="block text-xs text-muted-foreground">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StageCard({ stage, index, badge }: { stage: { title: string; description: string; items: string[] }; index: number; badge?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      "rounded-xl border bg-background/50 overflow-hidden transition-colors",
      open ? "border-primary" : "border-border",
    )}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-primary/5 transition-colors"
      >
        <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{stage.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{stage.description}</p>
        </div>
        {badge && <span className="text-xs text-primary font-medium shrink-0 mr-1">{badge}</span>}
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
          open && "rotate-180",
        )} />
      </button>

      <div className={cn(
        "grid transition-all duration-200 ease-in-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}>
        <div className="overflow-hidden">
          <ul className="px-4 pb-4 pt-1 space-y-1.5 border-t border-border ml-[3.25rem]">
            {stage.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PhasesBlock({ phases }: { phases: NonNullable<ServiceDetail["phases"]> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("rounded-xl border bg-background/50 overflow-hidden transition-colors", open ? "border-primary" : "border-border")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-primary/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{phases.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{phases.intro}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-200 ease-in-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="border-t border-border p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {phases.steps.map((step) => (
                <div key={step.title} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-primary">{step.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-tight">{step.title}</p>
                  <ul className="mt-2 space-y-1">
                    {step.items.map((item) => (
                      <li key={item} className="text-[13px] leading-snug text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t border-border pt-2 text-[12px] leading-snug text-foreground/80">
                    <span className="font-semibold text-primary">Entregável:</span> {step.deliverable}
                  </p>
                </div>
              ))}
            </div>
            {phases.note && <NoteBox note={phases.note} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductPresentation({ serviceKey, title }: { serviceKey: string; title: string }) {
  if (SCOPE_HTML_KEYS.has(serviceKey)) return <ScopeFrame serviceKey={serviceKey} title={title} />;

  const detail = SERVICE_DETAILS[serviceKey];
  if (!detail) return null;

  const hasPillars = !!detail.pillars?.length;
  const hasStages = !hasPillars && !!detail.stages?.length;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="rounded-xl bg-background/50 border border-border p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">O que é: {title}</p>
        <p className="text-sm leading-relaxed">{detail.what}</p>
      </div>

      {hasPillars && (
        <div>
          <Eyebrow>O que a O2 faz e o que você passa a ter</Eyebrow>
          {detail.pillarsIntro && <p className="text-sm text-muted-foreground -mt-1 mb-3">{detail.pillarsIntro}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {detail.pillars!.map((p, i) => (
              <PillarCard key={p.title} pillar={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {hasStages && (
        <div>
          <Eyebrow>
            {serviceKey === "assessoria"
              ? "Jornada de maturidade: 5 estágios de evolução"
              : serviceKey === "valuation"
                ? "Detalhamento do escopo: até 60 dias"
                : "Escopo: pilares de entrega"}
          </Eyebrow>
          <div className="space-y-2">
            {detail.stages!.map((stage, i) => (
              <StageCard
                key={stage.title}
                stage={stage}
                index={i}
                badge={serviceKey === "assessoria" ? "90 dias" : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {!hasPillars && !hasStages && (
        <div>
          <Eyebrow>Escopo: o que entrega</Eyebrow>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {detail.deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.notes?.map((n) => <NoteBox key={n.title} note={n} />)}

      {detail.team && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {detail.team.map((m) => (
            <div key={m.role} className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-sm font-semibold text-primary">{m.role}</p>
              <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{m.text}</p>
            </div>
          ))}
        </div>
      )}

      {detail.areas && (
        <div className="border-t border-border pt-4">
          <Eyebrow>{detail.areas.title}</Eyebrow>
          <p className="text-sm text-muted-foreground -mt-1 mb-3">{detail.areas.intro}</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {detail.areas.items.map((a, i) => (
              <div key={a} className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm">
                <span className="font-mono text-xs text-primary mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.modalities && (
        <div className="border-t border-border pt-4">
          <Eyebrow>{detail.modalities.title}</Eyebrow>
          <p className="text-sm text-muted-foreground -mt-1 mb-3">{detail.modalities.intro}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detail.modalities.options.map((m) => (
              <div key={m.name} className="rounded-xl border border-border bg-background/50 p-4">
                <p className="text-xs uppercase tracking-wider text-primary">{m.tag}</p>
                <p className="text-sm font-semibold mt-1">{m.name}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.comparison && (
        <div className="border-t border-border pt-4">
          <Eyebrow>{detail.comparison.title}</Eyebrow>
          <div className="rounded-xl border border-border overflow-hidden text-sm">
            <div className="grid grid-cols-2 bg-background/50 font-semibold">
              <p className="p-3 text-muted-foreground">{detail.comparison.headers[0]}</p>
              <p className="p-3 text-primary">{detail.comparison.headers[1]}</p>
            </div>
            {detail.comparison.rows.map(([a, b]) => (
              <div key={a} className="grid grid-cols-2 border-t border-border">
                <p className="p-3 text-muted-foreground">{a}</p>
                <p className="p-3 flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {b}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.video && (
        <a
          href={detail.video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-4 hover:border-primary/60 transition-colors"
        >
          <PlayCircle className="h-8 w-8 text-primary shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold">{detail.video.title}</span>
            <span className="block text-xs text-muted-foreground">{detail.video.text}</span>
          </span>
          <span className="text-xs text-primary shrink-0">Assistir no YouTube ↗</span>
        </a>
      )}

      {detail.phases && <PhasesBlock phases={detail.phases} />}

      {detail.results && detail.results.length > 0 && (
        <div className="border-t border-border pt-4">
          <Eyebrow>Resultados esperados</Eyebrow>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detail.results.map((r) => (
              <div key={r} className="rounded-xl border border-border bg-background/50 p-4 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm leading-snug">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.notIncluded && detail.notIncluded.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Não inclui</p>
          <div className="flex flex-wrap gap-2">
            {detail.notIncluded.map((n) => (
              <span key={n} className="text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1">{n}</span>
            ))}
          </div>
        </div>
      )}

      {detail.nextSteps && (
        <div className="border-t border-border pt-4">
          <Eyebrow>Próximos passos: o caminho até o kick-off</Eyebrow>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {detail.nextSteps.map((s, i) => (
              <div key={s.title} className="rounded-xl border border-border bg-background/50 p-4">
                <p className="font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-primary">
                  Etapa {String(i + 1).padStart(2, "0")}
                </p>
                <p className="text-sm font-semibold mt-1">{s.title}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">{s.text}</p>
              </div>
            ))}
          </div>
          {detail.cta && (
            <div className="mt-3 rounded-xl border border-primary/40 bg-primary/10 p-4">
              <p className="text-sm font-semibold">{detail.cta.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{detail.cta.text}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
