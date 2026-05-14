import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, BarChart3, Brain, Target, Briefcase, LineChart, Cpu, Bot, Compass, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const diap = [
  { icon: Database, title: "Dados Fidedignos", desc: "Base sólida com dados confiáveis e organizados" },
  { icon: BarChart3, title: "Informações Inteligentes", desc: "Transformamos dados em informações acionáveis" },
  { icon: Brain, title: "Análise Estratégica", desc: "Análise profunda para decisões assertivas" },
  { icon: Target, title: "Plano de Ação Efetivo", desc: "Ações concretas com impacto mensurável" },
];

const services = [
  { icon: Briefcase, title: "BPO Financeiro", desc: "Operação financeira completa sob gestão especializada" },
  { icon: LineChart, title: "CFO as a Service", desc: "Inteligência financeira executiva sob demanda" },
  { icon: Cpu, title: "Plataforma Oxy", desc: "Inteligência de dados em tempo real" },
  { icon: Bot, title: "Agente IA Gênio", desc: "Automação inteligente de processos financeiros" },
  { icon: Compass, title: "Assessoria Estratégica", desc: "Jornada de maturidade financeira personalizada" },
  { icon: Users, title: "Coordenador as a Service", desc: "Coordenação financeira dedicada para sua operação" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-primary" />
            <span className="font-bold tracking-tight">O2 Inc</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/servicos" className="hover:text-foreground">Serviços</Link>
            <Link to="/admin/login" className="hover:text-foreground">Admin</Link>
            <Link to="/diagnostico">
              <Button size="sm" className="rounded-md">Diagnóstico</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center justify-center px-6 pt-16"
        style={{ background: "linear-gradient(180deg, #0A0A0A 0%, #111111 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30"
             style={{ background: "radial-gradient(600px circle at 50% 30%, rgba(0,232,95,0.12), transparent 60%)" }} />
        <div className="relative max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Metodologia DIAP — O2 Inc
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Inteligência financeira que transforma{" "}
            <span className="text-primary">gestão em resultado</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra o grau de maturidade financeira da sua empresa e quanto os gaps operacionais estão custando.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/diagnostico">
              <Button size="lg" className="rounded-md text-base px-8 h-12">
                Iniciar Diagnóstico <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/servicos">
              <Button size="lg" variant="outline" className="rounded-md text-base px-8 h-12">
                Ver serviços
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* DIAP */}
      <section className="py-24 px-6 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Metodologia DIAP</h2>
            <p className="mt-4 text-muted-foreground">
              Quatro etapas conectadas que transformam o caos financeiro em clareza estratégica.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            {diap.map((d, i) => (
              <div
                key={d.title}
                className="relative bg-card border border-border border-l-4 rounded-xl p-6 transition-colors hover:border-primary/40"
                style={{ borderLeftColor: "#00E85F" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <d.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">Etapa 0{i + 1}</span>
                </div>
                <h3 className="font-semibold text-lg">{d.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-6 border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Nossos Serviços</h2>
            <p className="mt-4 text-muted-foreground">
              Soluções financeiras integradas para cada estágio da sua empresa.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="group bg-card border border-border rounded-xl p-6 transition-all hover:border-primary hover:-translate-y-0.5"
              >
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border">
        <div className="mx-auto max-w-3xl text-center">
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
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} O2 Inc. Todos os direitos reservados.
      </footer>
    </div>
  );
}
