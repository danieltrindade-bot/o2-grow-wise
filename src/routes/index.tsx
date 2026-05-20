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
      {/* Hero */}
      <section
        className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6"
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

      {/* Authority — Map */}
      <section className="border-t border-border overflow-hidden">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 min-h-[420px]">
          <div className="flex flex-col justify-end px-6 py-16 md:py-24 md:pr-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-4">Mapa de atuação</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Estamos presentes em <span className="text-primary">todo o Brasil</span>
            </h2>
            <div className="w-16 h-px bg-border mt-6 mb-4" />
            <p className="text-sm text-muted-foreground">Temos franquias espalhadas por todo país.</p>
          </div>
          <div className="relative h-64 md:h-auto overflow-hidden">
            <img
              src="/mapa-brasil.png"
              alt="Mapa de atuação O2 no Brasil"
              className="absolute inset-0 w-full h-full object-cover object-[70%_60%] scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* Authority — Numbers */}
      <section className="py-24 px-6 border-t border-border">
        <div className="mx-auto max-w-7xl">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "+1,09", unit: "BI", label: "Em passivos renegociados" },
              { value: "+1,55", unit: "BI", label: "Em operações financeiras" },
              { value: "+2.000", unit: "", label: "Empresas atendidas" },
              { value: "88", unit: "NPS", label: "Dado pelos nossos clientes" },
            ].map((m) => (
              <div key={m.label} className="bg-card border border-border rounded-xl p-6">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {m.value}
                  {m.unit && <span className="text-lg md:text-xl ml-1 text-muted-foreground font-semibold">{m.unit}</span>}
                </p>
                <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
              </div>
            ))}
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
