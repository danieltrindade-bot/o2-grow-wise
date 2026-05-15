import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert } from "lucide-react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-sm text-center rounded-2xl border border-border bg-card p-8">
          <ShieldAlert className="h-10 w-10 mx-auto text-[var(--color-critical)] mb-3" />
          <h1 className="text-lg font-semibold">Acesso negado</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sua conta não possui permissão de administrador.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
