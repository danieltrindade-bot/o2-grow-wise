import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Save } from "lucide-react";
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
import { SCORE_MAP, QUESTIONS as FALLBACK_QUESTIONS, type OptionKey } from "@/lib/diagnostic-questions";
import { useDiagnosticConfig, type DiagnosticQuestion } from "@/hooks/use-pricing";
import { CalcLoadingSkeleton } from "@/components/calc-ui";
import { cn } from "@/lib/utils";
import { formatDateBR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/diagnostico")({
  component: DiagnosticoPage,
});

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
  const { state, setState, goTo, saveMeeting } = useDiagnostic();
  const [attempted, setAttempted] = useState(false);
  const canSaveDraft = state.companyName.trim().length > 0;

  const missingCompany = !state.companyName.trim();
  const missingConsultant = !state.consultantName.trim();

  const handleNext = () => {
    setAttempted(true);
    if (missingCompany || missingConsultant) return;
    goTo(2);
  };

  const handleSaveDraft = () => {
    saveMeeting("draft");
    toast.success("Rascunho salvo com sucesso");
  };

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
            className={cn("h-10", attempted && missingCompany && "border-destructive")}
          />
          {attempted && missingCompany && (
            <p className="text-xs text-destructive">Campo obrigatório</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do Consultor</label>
          <Input
            value={state.consultantName}
            onChange={(e) => setState({ consultantName: e.target.value })}
            placeholder="Seu nome"
            className={cn("h-10", attempted && missingConsultant && "border-destructive")}
          />
          {attempted && missingConsultant && (
            <p className="text-xs text-destructive">Campo obrigatório</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Data</label>
          <p className="text-base">{formatDateBR(state.date)}</p>
        </div>

        <div className="pt-2 flex justify-between">
          <Button
            variant="outline"
            disabled={!canSaveDraft}
            onClick={handleSaveDraft}
          >
            <Save className="mr-2 h-4 w-4" /> Salvar Rascunho
          </Button>
          <Button
            onClick={handleNext}
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
  const [attempted, setAttempted] = useState(false);

  const missingRevenue = state.monthlyRevenue <= 0;
  const missingAge = !state.companyAge;
  const missingGrowth = !state.growth;

  const handleNext = () => {
    setAttempted(true);
    if (missingRevenue || missingAge || missingGrowth) return;
    goTo(3);
  };

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
          {attempted && missingRevenue ? (
            <p className="text-xs text-destructive">Campo obrigatório</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Usado para calcular estimativas de custo
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Há quanto tempo a empresa existe?</label>
          <Select
            value={state.companyAge || undefined}
            onValueChange={(v) => setState({ companyAge: v as typeof state.companyAge })}
          >
            <SelectTrigger className={cn("h-10", attempted && missingAge && "border-destructive")}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="less_1">Menos de 1 ano</SelectItem>
              <SelectItem value="1_3">1 a 3 anos</SelectItem>
              <SelectItem value="3_7">3 a 7 anos</SelectItem>
              <SelectItem value="more_7">Mais de 7 anos</SelectItem>
            </SelectContent>
          </Select>
          {attempted && missingAge && (
            <p className="text-xs text-destructive">Campo obrigatório</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Crescimento nos últimos 2 anos</label>
          <Select
            value={state.growth || undefined}
            onValueChange={(v) => setState({ growth: v as typeof state.growth })}
          >
            <SelectTrigger className={cn("h-10", attempted && missingGrowth && "border-destructive")}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong">Crescimento forte</SelectItem>
              <SelectItem value="moderate">Crescimento moderado</SelectItem>
              <SelectItem value="stable">Estável</SelectItem>
              <SelectItem value="declining">Em queda</SelectItem>
            </SelectContent>
          </Select>
          {attempted && missingGrowth && (
            <p className="text-xs text-destructive">Campo obrigatório</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Quais os principais desafios hoje?</label>
          <ChallengeGrid
            selected={state.mainChallenges}
            onChange={(v) => setState({ mainChallenges: v })}
          />
        </div>

        <div className="pt-2 flex justify-between">
          <Button variant="outline" onClick={() => goTo(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const CHALLENGE_OPTIONS = [
  "Fluxo de caixa",
  "Lucratividade",
  "Equipe júnior / falta braço",
  "Confiança nos dados",
  "Tudo em planilha / manual",
  "Conciliação bancária",
  "Falta de previsibilidade",
] as const;

function ChallengeGrid({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option],
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CHALLENGE_OPTIONS.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                active
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/40",
              )}
            >
              {active && (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
              )}
            </span>
            {option}
          </button>
        );
      })}
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

interface UIQuestion {
  id: string;
  category: string;
  text: string;
  options: { key: OptionKey; label: string }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  financial: "Gestao Financeira",
  commercial: "Gestao Comercial",
};

function toUIQuestion(q: DiagnosticQuestion): UIQuestion {
  return {
    id: `${q.dimension}:${q.question_key}`,
    category: q.dimension,
    text: q.question_text,
    options: [
      { key: "green", label: q.option_green },
      { key: "yellow", label: q.option_yellow },
      { key: "red", label: q.option_red },
    ],
  };
}

function Screen3() {
  const { state, setState, goTo, saveMeeting } = useDiagnostic();
  const navigate = useNavigate();
  const { data, isLoading, error } = useDiagnosticConfig();

  const fallbackUI: UIQuestion[] = useMemo(
    () =>
      FALLBACK_QUESTIONS.map((q) => ({
        id: q.id,
        category: q.category,
        text: q.text,
        options: q.options.map((o) => ({ key: o.key, label: o.label })),
      })),
    [],
  );

  const questions: UIQuestion[] = useMemo(() => {
    const fromDb = (data?.questions ?? []).map(toUIQuestion);
    return fromDb.length > 0 ? fromDb : fallbackUI;
  }, [data, fallbackUI]);

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, UIQuestion[]> = {};
    for (const q of questions) {
      const cat = q.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    }
    return groups;
  }, [questions]);

  const answeredCount = useMemo(
    () => questions.filter((q) => state.answers[q.id]).length,
    [state.answers, questions],
  );
  const total = questions.length;
  const allAnswered = total > 0 && answeredCount === total;
  const progressPct = total > 0 ? (answeredCount / total) * 100 : 0;

  const handleSelect = (questionId: string, key: TrafficLight) => {
    setState({ answers: { ...state.answers, [questionId]: key } });
  };

  const handleFinish = () => {
    const overallScore = questions.reduce((sum, q) => {
      const ans = state.answers[q.id];
      return sum + (ans ? SCORE_MAP[ans as OptionKey] : 0);
    }, 0);
    setState({ overallScore });
    try { saveMeeting("completed", { overallScore }); } catch {}
    navigate({ to: "/resultados" });
  };

  const showLoading = isLoading && !error;

  return (
    <div>
      <ScreenHeader title="Diagnóstico Financeiro" step={3} />

      {showLoading && <CalcLoadingSkeleton />}

      {!showLoading && (

        <>
          <div className="sticky top-0 z-10 -mx-4 px-4 py-4 bg-background/90 backdrop-blur border-b border-border mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <span className="text-sm font-medium">
                {answeredCount} de {total}
              </span>
            </div>
            <Progress value={progressPct} />
          </div>

          <div className="space-y-6">
            {Object.entries(groupedQuestions).map(([category, catQuestions]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-primary mb-3 mt-6 first:mt-0">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <div className="space-y-6">
                  {catQuestions.map((q) => {
                    const globalIdx = questions.indexOf(q);
                    return (
                      <div key={q.id} className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-start gap-3 mb-5">
                          <span className="text-xs font-semibold text-muted-foreground mt-1">
                            {String(globalIdx + 1).padStart(2, "0")}
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
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <label className="text-sm font-medium">Anotações da reunião</label>
            <Textarea
              value={state.notes}
              onChange={(e) => setState({ notes: e.target.value })}
              placeholder="Observações livres durante a call..."
              rows={4}
              className="mt-2"
            />
          </div>
        </>
      )}

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
