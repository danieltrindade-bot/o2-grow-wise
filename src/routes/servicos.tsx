import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  LineChart,
  Bot,
  Compass,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useDiagnostic } from "@/context/DiagnosticContext";
import { getRecommendation, type Recommendation } from "@/lib/results-logic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/servicos")({
  component: ServicosPage,
});

interface ServiceCard {
  id: string;
  name: string;
  description: string;
  to: "/calculadora/bpo" | "/calculadora/cfo" | "/calculadora/oxy" | "/calculadora/assessoria" | "/calculadora/coordenador";
  Icon: typeof Briefcase;
}

const SERVICES: ServiceCard[] = [
  {
    id: "bpo",
    name: "BPO Financeiro",
    description: "Operação financeira completa: contas a pagar, contas a receber, conciliação, relatórios",
    to: "/calculadora/bpo",
    Icon: Briefcase,
  },
  {
    id: "cfo",
    name: "CFO as a Service",
    description: "Inteligência financeira executiva: planejamento, análise, governança, indicadores",
    to: "/calculadora/cfo",
    Icon: LineChart,
  },
  {
    id: "oxy",
    name: "Oxy + Gênio",
    description: "Plataforma de dados em tempo real + Agente IA para automação financeira",
    to: "/calculadora/oxy",
    Icon: Bot,
  },
  {
    id: "assessoria",
    name: "Assessoria Estratégica",
    description: "Jornada de maturidade financeira com acompanhamento especializado",
    to: "/calculadora/assessoria",
    Icon: Compass,
  },
  {
    id: "coordenador",
    name: "Coordenador as a Service",
    description: "Coordenação financeira dedicada para estruturar e gerir sua operação",
    to: "/calculadora/coordenador",
    Icon: Users,
  },
];

function ServicosPage() {
  const { state } = useDiagnostic();
  const hasDiagnostic =
    state.companyName.trim().length > 0 && Object.keys(state.answers).length > 0;

  const rec: Recommendation | null = hasDiagnostic
    ? getRecommendation(state.overallScore, state.answers)
    : null;

  const isPrimary = (s: ServiceCard) => rec?.service === s.name;
  const isComplementary = (s: ServiceCard) => rec?.complementary?.service === s.name;
  const isRecommended = (s: ServiceCard) => isPrimary(s) || isComplementary(s);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">
            {hasDiagnostic ? "Serviços Recomendados" : "Nossos Serviços"}
          </h1>
          <p className="text-muted-foreground mt-2">Selecione um serviço para precificar</p>
          {!hasDiagnostic && (
            <p className="text-sm text-muted-foreground/80 mt-3">
              Faça o{" "}
              <Link to="/diagnostico" className="text-primary underline underline-offset-4 hover:text-primary/80">
                diagnóstico financeiro
              </Link>{" "}
              para receber recomendações personalizadas de serviços.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s) => {
            const recommended = isRecommended(s);
            return (
              <div
                key={s.id}
                className={cn(
                  "group rounded-2xl border bg-card p-6 flex flex-col transition-colors",
                  recommended
                    ? "border-primary shadow-[0_0_0_1px_var(--color-primary)]"
                    : "border-border hover:border-primary/60",
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-lg bg-primary/15 p-2.5">
                    <s.Icon className="h-5 w-5 text-primary" />
                  </div>
                  {isPrimary(s) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-semibold">
                      <Sparkles className="h-3 w-3" /> Recomendado
                    </span>
                  )}
                  {isComplementary(s) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-muted-foreground px-2.5 py-0.5 text-xs font-medium">
                      Complementar
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 flex-1">{s.description}</p>
                <Link to={s.to} className="mt-5">
                  <Button
                    className={cn(
                      "w-full",
                      recommended
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "",
                    )}
                    variant={recommended ? "default" : "outline"}
                  >
                    Calcular Preço <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
