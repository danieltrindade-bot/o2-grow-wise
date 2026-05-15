import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
});

function AdminIndexPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary">Painel Admin</p>
            <h1 className="text-3xl font-bold mt-1">Bem-vindo</h1>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8">
          <p className="text-muted-foreground">
            Em breve: edição de perguntas, parâmetros de custo, recomendações e
            preços de todos os serviços.
          </p>
        </div>
      </div>
    </div>
  );
}
