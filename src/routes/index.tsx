import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Database, BarChart3, Brain, Target,
  Briefcase, LineChart, Cpu, Compass,
  ArrowRight, TrendingUp, DollarSign, Receipt, CreditCard, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function useInView(threshold = 0.15): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function CountUp({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [ref, visible] = useInView(0.3);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const dur = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * end));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, end]);
  return <span ref={ref}>{prefix}{val.toLocaleString("pt-BR")}{suffix}</span>;
}

const diap = [
  { letter: "D", icon: Database, title: "Dados Fidedignos", desc: "Captura limpa, na fonte, com integridade contábil." },
  { letter: "I", icon: BarChart3, title: "Informações Inteligentes", desc: "Dados refinados em DRE, fluxo, ciclo financeiro." },
  { letter: "A", icon: Brain, title: "Análise Estratégica", desc: "Leitura técnica do que decide o futuro do negócio." },
  { letter: "P", icon: Target, title: "Plano de Ação Efetivo", desc: "Recomendações concretas, mensuráveis, executáveis." },
];

const processes = [
  { icon: Receipt, label: "Contas a Pagar" },
  { icon: DollarSign, label: "Contas a Receber" },
  { icon: Wallet, label: "Tesouraria" },
  { icon: CreditCard, label: "Conciliação" },
  { icon: TrendingUp, label: "Faturamento" },
];

const pillars = [
  {
    level: "Operacional",
    desc: "Execução do dia a dia financeiro com processos padronizados e controle rigoroso da rotina",
    icon: Briefcase,
  },
  {
    level: "Tático",
    desc: "Inteligência financeira para decisões de médio prazo com análise e planejamento avançado",
    icon: LineChart,
  },
  {
    level: "Estratégico",
    desc: "Visão de longo prazo, maturidade financeira e governança para crescimento sustentável",
    icon: Compass,
  },
];

const cases = [
  {
    ramo: "Importadora e Distribuidora",
    faturamento: "R$ 25M",
    escopo: "CFO as a Service",
    headline: "Geração de caixa de R$ 2,5M em 60 dias",
    dores: ["Falta de previsibilidade de caixa", "Tomada de recursos sem clareza"],
    results: [
      { label: "Caixa previsto (início)", value: "- R$ 1,7M" },
      { label: "Caixa realizado (60 dias)", value: "R$ 796K" },
      { label: "Geração de caixa", value: "R$ 2,5M", highlight: true },
    ],
  },
  {
    ramo: "Indústria de máquinas",
    faturamento: "R$ 50M",
    escopo: "CFO as a Service",
    headline: "Redução de 42% no endividamento",
    dores: ["Falta de clareza sobre resultados", "Alto volume de dívida de curto prazo"],
    results: [
      { label: "Endividamento/Faturamento", value: "-42%", highlight: true },
      { label: "Geração de caixa (12 meses)", value: "R$ 4,39M" },
    ],
  },
  {
    ramo: "Transporte e logística",
    faturamento: "R$ 12,8M",
    escopo: "CFO as a Service",
    headline: "Crescimento de 57% no faturamento",
    dores: ["Sem visão por unidade de negócio", "Investimentos sem retorno adequado"],
    results: [
      { label: "Faturamento 2025", value: "R$ 12,8M" },
      { label: "Projeção 2026", value: "R$ 20M" },
      { label: "Crescimento", value: "+57%", highlight: true },
    ],
  },
];

function AnimatedSection({ children, className, delay = 0, style }: { children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      )}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

function ServicePillars() {
  const [ref, visible] = useInView(0.2);
  return (
    <div ref={ref} className="relative">
      {/* Pillar columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <AnimatedSection key={p.level} delay={i * 150}>
            <div className="relative bg-card border border-border rounded-2xl p-8 h-full flex flex-col items-center text-center hover:border-primary/50 transition-colors">
              <div className="h-14 w-14 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-5">
                <p.icon className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-3">{p.level}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              {/* Connector dot */}
              <div className="hidden md:flex justify-center mt-6">
                <div className={cn(
                  "h-3 w-3 rounded-full transition-all duration-700",
                  visible ? "bg-primary shadow-[0_0_8px_rgba(0,232,95,0.5)]" : "bg-border",
                )} />
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* SVG connection lines (desktop only) */}
      <div className="hidden md:block relative h-24">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 96" fill="none">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Left → center */}
          <path d="M 150 0 L 150 48 L 450 48 L 450 96" stroke="url(#lineGrad)" strokeWidth="2"
            className={cn("transition-all duration-1000", visible ? "opacity-100" : "opacity-0")}
            strokeDasharray="10 6"
            style={{ animation: visible ? "dashFlow 2s linear infinite" : "none" }} />
          {/* Center (Tático → Tecnologia) — same dash style with glow */}
          <path d="M 450 0 L 450 96" stroke="var(--color-primary)" strokeWidth="2.5" filter="url(#glow)"
            className={cn("transition-all duration-1000 delay-200", visible ? "opacity-100" : "opacity-0")}
            strokeDasharray="10 6"
            style={{ animation: visible ? "dashFlow 1.5s linear infinite" : "none" }} />
          {/* Right → center */}
          <path d="M 750 0 L 750 48 L 450 48 L 450 96" stroke="url(#lineGrad)" strokeWidth="2"
            className={cn("transition-all duration-1000 delay-500", visible ? "opacity-100" : "opacity-0")}
            strokeDasharray="10 6"
            style={{ animation: visible ? "dashFlow 2s linear infinite 0.6s" : "none" }} />
        </svg>
      </div>

      {/* Technology box */}
      <AnimatedSection delay={500}>
        <div className="relative mx-auto max-w-sm md:max-w-md rounded-2xl border-2 border-primary bg-card p-6 text-center"
             style={{ boxShadow: "0 0 30px rgba(0,232,95,0.15)" }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Tecnologia</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Plataforma Oxy + Agente IA Gênio
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Base tecnológica que potencializa todos os pilares
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 overflow-hidden">
        <div
          className="absolute inset-0 animate-[kenburns_20s_ease-in-out_infinite_alternate]"
          style={{
            backgroundImage: "url(/o2-office.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 pointer-events-none opacity-40"
             style={{ background: "radial-gradient(600px circle at 50% 30%, rgba(0,232,95,0.15), transparent 60%)" }} />
        <div className="relative max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-3 py-1 text-xs text-muted-foreground mb-8 animate-[fadeSlideUp_0.8s_ease-out_0.2s_both]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            A maior assessoria de CFO as a Service do Brasil
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] animate-[fadeSlideUp_0.8s_ease-out_0.4s_both]">
            Inteligência financeira que transforma{" "}
            <span className="text-primary">gestão em resultado</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-[fadeSlideUp_0.8s_ease-out_0.6s_both]">
            Há 13 anos ajudando empresários a tomarem decisões mais técnicas, unindo especialistas financeiros, metodologia proprietária e plataforma de inteligência.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 animate-[fadeSlideUp_0.8s_ease-out_0.8s_both]">
            <Link to="/diagnostico">
              <Button size="lg" className="rounded-md text-base px-8 h-12">
                Iniciar Diagnóstico <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/servicos">
              <Button size="lg" variant="outline" className="rounded-md text-base px-8 h-12 border-white/20 hover:bg-white/10">
                Ver serviços
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Authority — Map ── */}
      <section
        className="border-t border-border overflow-hidden relative min-h-[420px]"
        style={{
          backgroundImage: "url(/mapa-brasil.png)",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background from-35% via-background/85 via-55% to-background/20" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24 min-h-[420px] flex flex-col justify-end">
          <AnimatedSection>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">Mapa de atuação</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight max-w-lg">
              Estamos presentes em <span className="text-primary">todo o Brasil</span>
            </h2>
            <div className="w-16 h-px bg-border mt-6 mb-4" />
            <p className="text-sm text-muted-foreground">Temos franquias espalhadas por todo o país.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Authority — Numbers ── */}
      <section className="py-24 px-6 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-end mb-16">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">Resultados acumulados</p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  13 anos de <span className="text-primary">experiência</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-sm text-sm md:text-right">
                Atendemos empresas de todos os portes e segmentos, da indústria ao serviço.
              </p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { display: "+1,09", unit: "BI", label: "Em passivos renegociados" },
              { display: "+1,55", unit: "BI", label: "Em operações financeiras" },
              { display: "+2.000", unit: "", label: "Empresas atendidas" },
              { display: "88", unit: "NPS", label: "Dado pelos nossos clientes" },
            ].map((m, i) => (
              <AnimatedSection key={m.label} delay={i * 100}>
                <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors">
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    {m.display}
                    {m.unit && <span className="text-lg md:text-xl ml-1 text-muted-foreground font-semibold">{m.unit}</span>}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── O Problema ── */}
      <section className="py-24 px-6 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5"
             style={{ background: "radial-gradient(800px circle at 30% 50%, rgba(239,68,68,0.3), transparent 60%)" }} />
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">O cenário brasileiro</p>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="text-red-500"><CountUp end={2} /> milhões</span> de empresas fecham por ano
              </h2>
              <p className="mt-6 text-muted-foreground max-w-lg">
                A falta de gestão eficiente é o segundo maior motivo para o fechamento de empresas no Brasil.
                48% delas fecham em até três anos.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={200} className="flex justify-center">
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl max-w-sm hover:scale-[1.02] transition-transform duration-500">
                <img src="/g1-article.png" alt="Artigo G1 sobre fechamento de empresas" className="w-full" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── Lucro e Caixa ── */}
      <section className="py-32 px-6 border-t border-border relative">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: "radial-gradient(600px circle at 50% 50%, rgba(0,232,95,0.06), transparent 60%)" }} />
        <AnimatedSection className="mx-auto max-w-4xl text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-6">A chave para a longevidade</p>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Qualquer empresa nasce com um único objetivo:
          </h2>
          <div className="mt-8 flex items-center justify-center gap-6 md:gap-10">
            <span className="text-5xl md:text-8xl font-black text-primary animate-[pulse_3s_ease-in-out_infinite]">LUCRO</span>
            <span className="text-3xl md:text-5xl text-muted-foreground font-light">&</span>
            <span className="text-5xl md:text-8xl font-black text-primary animate-[pulse_3s_ease-in-out_0.5s_infinite]">CAIXA</span>
          </div>
          <p className="mt-8 text-lg text-muted-foreground max-w-xl mx-auto">
            Gestão eficiente é prática diária, sustentada por <strong className="text-foreground">dados, processos e ferramentas.</strong>
          </p>
        </AnimatedSection>
      </section>

      {/* ── DIAP ── */}
      <section className="py-24 px-6 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">Nossa metodologia</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Metodologia <span className="text-primary">DIAP</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Quatro etapas encadeadas. Sem atalhos.
            </p>
          </AnimatedSection>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="hidden md:block absolute top-14 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            {diap.map((d, i) => (
              <AnimatedSection key={d.title} delay={i * 150}>
                <div className="relative bg-card border border-border rounded-xl p-6 transition-all hover:border-primary/60 hover:-translate-y-1 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-black">
                      {d.letter}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">Etapa 0{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-lg">{d.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dado é organismo vivo ── */}
      <section className="py-24 px-6 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="text-center mb-24">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">Princípio fundamental</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Dado é um <span className="text-primary">organismo vivo</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Esses dados vêm dos cinco processos essenciais no financeiro de qualquer empresa.
            </p>
          </AnimatedSection>
          <div className="relative flex items-center justify-center py-16 min-h-[420px]">
            <div className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-dashed border-primary/20 animate-[spin_30s_linear_infinite]" />
            <div className="absolute w-44 h-44 md:w-56 md:h-56 rounded-full border border-primary/10" />
            <div className="relative z-10 h-20 w-20 md:h-24 md:w-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
              <Database className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              {processes.map((p, i) => {
                const angle = (i * 72 - 90) * (Math.PI / 180);
                const radius = 160;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <AnimatedSection
                    key={p.label}
                    delay={i * 100 + 300}
                    className="absolute"
                    style={{ transform: `translate(${x}px, ${y}px)` } as any}
                  >
                    <div className="flex flex-col items-center gap-2 group">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-card border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                        <p.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <span className="text-[10px] md:text-xs text-muted-foreground font-medium text-center whitespace-nowrap">{p.label}</span>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Oxy + Gênio ── */}
      <section className="py-24 px-6 border-t border-border bg-card/30 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">Informação inteligente</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                <span className="text-primary">Oxy Finance</span> + Gênio
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg">
                Plataforma completa de inteligência financeira com agente de IA dedicado a CFOs.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                  { value: "5", label: "Anos de desenvolvimento" },
                  { value: "+R$3M", label: "Investidos no produto" },
                  { value: "+50", label: "CFOs na construção" },
                ].map((s, i) => (
                  <AnimatedSection key={s.label} delay={i * 100 + 200}>
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection delay={200} className="relative flex items-center justify-center">
              <div className="relative">
                <img
                  src="/oxy-dashboard.png"
                  alt="Plataforma Oxy Finance"
                  className="rounded-xl shadow-2xl border border-border/50 hover:scale-[1.02] transition-transform duration-700"
                />
                <img
                  src="/genio-card.png"
                  alt="Agente IA Gênio"
                  className="absolute -bottom-6 -right-6 w-28 md:w-36 rounded-xl shadow-xl border border-border/50 animate-[float_4s_ease-in-out_infinite]"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── 90 dias ── */}
      <section className="py-24 px-6 border-t border-border">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">Do dado ao resultado</p>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-primary"><CountUp end={90} /></span> dias para o resultado
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Nosso processo estruturado entrega resultados mensuráveis em 90 dias, da fundação de dados à análise estratégica.
          </p>
          <div className="mt-10 flex items-center justify-center gap-2 md:gap-4">
            {[
              { label: "Fundação", day: "01d" },
              { label: "Processos", day: "30d" },
              { label: "Análise", day: "60d" },
              { label: "Resultado", day: "90d" },
            ].map((step, i) => (
              <AnimatedSection key={step.label} delay={i * 150 + 200} className="flex items-center gap-2 md:gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    i === 3 ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground",
                  )}>
                    {step.day}
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground">{step.label}</span>
                </div>
                {i < 3 && <div className="w-8 md:w-16 h-px bg-gradient-to-r from-primary/50 to-primary/20 mb-5" />}
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── Services ── */}
      <section className="py-24 px-6 border-t border-border bg-card/30 overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Nossos Serviços</h2>
            <p className="mt-4 text-muted-foreground">
              Soluções financeiras integradas para cada estágio da sua empresa.
            </p>
          </AnimatedSection>

          <ServicePillars />
        </div>
      </section>

      {/* ── Cases de Sucesso ── */}
      <section className="py-24 px-6 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">Resultados reais</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Cases de Sucesso</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cases.map((c, i) => (
              <AnimatedSection key={c.ramo} delay={i * 150}>
                <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-primary font-semibold uppercase tracking-wider">{c.escopo}</span>
                    <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2.5 py-0.5">{c.faturamento}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{c.ramo}</p>
                  <h3 className="text-lg font-bold leading-snug mb-4">{c.headline}</h3>
                  <div className="space-y-1.5 mb-5">
                    {c.dores.map((d) => (
                      <p key={d} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-red-500/70 mt-0.5">●</span> {d}
                      </p>
                    ))}
                  </div>
                  <div className="mt-auto border-t border-border pt-4 space-y-3">
                    {c.results.map((r) => (
                      <div key={r.label} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{r.label}</span>
                        <span className={cn(
                          "text-sm font-bold",
                          r.highlight ? "text-primary" : "text-foreground",
                        )}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: "radial-gradient(600px circle at 50% 50%, rgba(0,232,95,0.08), transparent 60%)" }} />
        <AnimatedSection className="mx-auto max-w-3xl text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Pronto para descobrir o potencial da sua{" "}
            <span className="text-primary">gestão financeira?</span>
          </h2>
          <div className="mt-10">
            <Link to="/diagnostico">
              <Button size="lg" className="rounded-md text-base px-8 h-12">
                Começar Diagnóstico Gratuito <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </section>

      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} O2 Inc. Todos os direitos reservados.
      </footer>
    </div>
  );
}
