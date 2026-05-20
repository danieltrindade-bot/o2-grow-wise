import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  Building2,
  User,
  ArrowRight,
  Trash2,
  FileText,
} from "lucide-react";
import { useDiagnostic, type Meeting } from "@/context/DiagnosticContext";
import { selectAll, deleteRow } from "@/lib/local-store";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateBR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reunioes")({
  component: ReunioesPage,
});

type StatusFilter = "all" | "draft" | "completed";

function ReunioesPage() {
  const { loadMeeting } = useDiagnostic();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const meetings = useMemo(() => {
    void refreshKey;
    return selectAll<Meeting>("meetings")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.companyName.toLowerCase().includes(q) ||
          m.consultantName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [meetings, search, statusFilter]);

  const handleResume = (meeting: Meeting) => {
    loadMeeting(meeting);
    if (meeting.status === "completed") {
      navigate({ to: "/resultados" });
    } else {
      navigate({ to: "/diagnostico" });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.")) return;
    deleteRow("meetings", id);
    setRefreshKey((k) => k + 1);
  };

  const scoreColor = (score: number) => {
    const grade = Math.round(((20 - score) / 20) * 10);
    if (grade >= 7) return "text-[var(--color-success)]";
    if (grade >= 5) return "text-[var(--color-warning)]";
    if (grade >= 3) return "text-[var(--color-alert)]";
    return "text-[var(--color-critical)]";
  };

  const gradeFromScore = (score: number) => Math.round(((20 - score) / 20) * 10);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Breadcrumbs items={[{ label: "Reuniões" }]} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico de diagnósticos realizados
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/diagnostico" })}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Novo Diagnóstico <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por empresa ou consultor..."
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "completed", "draft"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-3 py-2 text-sm rounded-md border transition-colors",
                  statusFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-accent",
                )}
              >
                {f === "all" ? "Todos" : f === "completed" ? "Concluídos" : "Rascunhos"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">Nenhuma reunião encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              {meetings.length === 0
                ? "Comece seu primeiro diagnóstico para ver o histórico aqui."
                : "Tente ajustar os filtros de busca."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold truncate">{m.companyName}</h3>
                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          m.status === "completed"
                            ? "bg-[color-mix(in_oklab,var(--color-success)_18%,transparent)] text-[var(--color-success)]"
                            : "bg-[color-mix(in_oklab,var(--color-warning)_18%,transparent)] text-[var(--color-warning)]",
                        )}
                      >
                        {m.status === "completed" ? "Concluido" : "Rascunho"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {m.consultantName}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateBR(m.date)}
                      </span>
                      {m.status === "completed" && (
                        <span className={cn("font-semibold", scoreColor(m.overallScore))}>
                          Nota: {gradeFromScore(m.overallScore)}/10
                        </span>
                      )}
                    </div>

                    {m.notes && (
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {m.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(m.id)}
                      className="text-muted-foreground hover:text-[var(--color-critical)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResume(m)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {m.status === "completed" ? "Ver Resultados" : "Retomar"}{" "}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
