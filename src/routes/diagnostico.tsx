import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useDiagnostic, type TrafficLight } from "@/context/DiagnosticContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUESTIONS, SCORE_MAP, type OptionKey } from "@/lib/diagnostic-questions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/diagnostico")({
  component: DiagnosticoPage,
});

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function DiagnosticoPage() {
  const { state } = useDiagnostic();
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {state.currentScreen === 1 && <Screen1 />}
        {state.currentScreen === 2 && <Screen2 />}
        {state.currentScreen === 3 && <Screen3 />}
      </div>
    </div>
  );
}

function ScreenHeader({ title, step }: { title: string; step: number }) {
  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Etapa {step} de 3
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
    </div>
  );
}

function Screen1() {
  const { state, setState, goTo } = useDiagnostic();
  const canNext = state.companyName.trim() && state.consultantName.trim();

  return (
    <div className="mx-auto max-w-xl">
      <ScreenHeader title="Novo Diagnóstico" step={1} />
      <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome da Empresa</label>
          <Input
            value={state.companyName}
            onChange={(e) => setState({ companyName: e.target.value })}
            placeholder="Ex: Acme S.A."
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do Consultor</label>
          <Input
            value={state.consultantName}
            onChange={(e) => setState({ consultantName: e.target.value })}
            placeholder="Seu nome"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Data</label>
          <p className="text-base">{formatDateBR(state.date)}</p>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            disabled={!canNext}
            onClick={() => goTo(2)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Screen2() {
  const { state, setState, goTo } = useDiagnostic();
  const canNext = state.monthlyRevenue > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <ScreenHeader title="Entendimento do Negócio" step={2} />
      <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Faturamento mensal médio</label>
          <CurrencyInput
            value={state.monthlyRevenue}
            onValueChange={(v) => setState({ monthlyRevenue: v })}
          />
          <p className="text-xs text-muted-foreground">
            Usado para calcular estimativas de custo
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Há quanto tempo a empresa existe?</label>
          <Select
            value={state.companyAge || undefined}
            onValueChange={(v) => setState({ companyAge: v as typeof state.companyAge })}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="less_1">Menos de 1 ano</SelectItem>
              <SelectItem value="1_3">1 a 3 anos</SelectItem>
              <SelectItem value="3_7">3 a 7 anos</SelectItem>
              <SelectItem value="more_7">Mais de 7 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Crescimento nos últimos 2 anos</label>
          <Select
            value={state.growth || undefined}
            onValueChange={(v) => setState({ growth: v as typeof state.growth })}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong">Crescimento forte</SelectItem>
              <SelectItem value="moderate">Crescimento moderado</SelectItem>
              <SelectItem value="stable">Estável</SelectItem>
              <SelectItem value="declining">Em queda</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Principal desafio hoje</label>
          <Textarea
            value={state.mainChallenge}
            onChange={(e) => setState({ mainChallenge: e.target.value })}
            placeholder="Descreva o principal desafio..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">O que motivou essa conversa agora?</label>
          <Textarea
            value={state.meetingMotivation}
            onChange={(e) => setState({ meetingMotivation: e.target.value })}
            placeholder="Conte o contexto..."
            rows={3}
          />
        </div>

        <div className="pt-2 flex justify-between">
          <Button variant="outline" onClick={() => goTo(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            disabled={!canNext}
            onClick={() => goTo(3)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const OPTION_META: Record<
  OptionKey,
  { borderClass: string; bgSelected: string; borderSelected: string; Icon: typeof CheckCircle2; iconClass: string }
> = {
  green: {
    borderClass: "border-l-[var(--color-success)]",
    bgSelected: "bg-[color-mix(in_oklab,var(--color-success)_18%,transparent)]",
    borderSelected: "border-[var(--color-success)]",
    Icon: CheckCircle2,
    iconClass: "text-[var(--color-success)]",
  },
  yellow: {
    borderClass: "border-l-[var(--color-warning)]",
    bgSelected: "bg-[color-mix(in_oklab,var(--color-warning)_18%,transparent)]",
    borderSelected: "border-[var(--color-warning)]",
    Icon: AlertTriangle,
    iconClass: "text-[var(--color-warning)]",
  },
  red: {
    borderClass: "border-l-[var(--color-critical)]",
    bgSelected: "bg-[color-mix(in_oklab,var(--color-critical)_18%,transparent)]",
    borderSelected: "border-[var(--color-critical)]",
    Icon: XCircle,
    iconClass: "text-[var(--color-critical)]",
  },
};

function Screen3() {
  const { state, setState, goTo } = useDiagnostic();
  const navigate = useNavigate();

  const answeredCount = useMemo(
    () => QUESTIONS.filter((q) => state.answers[q.id]).length,
    [state.answers],
  );
  const allAnswered = answeredCount === QUESTIONS.length;
  const progressPct = (answeredCount / QUESTIONS.length) * 100;

  const handleSelect = (questionId: string, key: TrafficLight) => {
    setState({ answers: { ...state.answers, [questionId]: key } });
  };

  const handleFinish = () => {
    const overallScore = QUESTIONS.reduce((sum, q) => {
      const ans = state.answers[q.id];
      return sum + (ans ? SCORE_MAP[ans as OptionKey] : 0);
    }, 0);
    setState({ overallScore });
    navigate({ to: "/resultados" });
  };

  return (
    <div>
      <ScreenHeader title="Diagnóstico Financeiro" step={3} />

      <div className="sticky top-0 z-10 -mx-4 px-4 py-4 bg-background/90 backdrop-blur border-b border-border mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progresso</span>
          <span className="text-sm font-medium">
            {answeredCount} de {QUESTIONS.length}
          </span>
        </div>
        <Progress value={progressPct} />
      </div>

      <div className="space-y-6">
        {QUESTIONS.map((q, idx) => (
          <div key={q.id} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="text-xs font-semibold text-muted-foreground mt-1">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="text-base md:text-lg font-medium leading-snug">{q.text}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {q.options.map((opt) => {
                const meta = OPTION_META[opt.key];
                const selected = state.answers[q.id] === opt.key;
                const Icon = meta.Icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelect(q.id, opt.key)}
                    className={cn(
                      "text-left rounded-xl border bg-[#111111] border-border border-l-4 p-4 transition-all hover:border-l-[5px]",
                      meta.borderClass,
                      selected && cn("border", meta.borderSelected, meta.bgSelected),
                    )}
                  >
                    <Icon className={cn("h-5 w-5 mb-2", meta.iconClass)} />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => goTo(2)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button
          disabled={!allAnswered}
          onClick={handleFinish}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Ver Resultados <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
