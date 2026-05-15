import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

const ADMIN_DOMAIN = "@o2inc.com.br";

function AdminLoginPage() {
  const { signIn, signUp, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && role === "admin") navigate({ to: "/admin" });
  }, [loading, user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error: err } = await fn(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground mb-6">
          ← Voltar ao site
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="rounded-lg bg-primary/15 p-2">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-primary">Painel Admin</p>
              <h1 className="text-xl font-bold">{mode === "signin" ? "Entrar" : "Criar conta admin"}</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`nome${ADMIN_DOMAIN}`}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="rounded-md border border-[var(--color-critical)] bg-[color-mix(in_oklab,var(--color-critical)_14%,transparent)] px-3 py-2 text-sm text-[var(--color-critical)]">
                {error}
              </div>
            )}

            {mode === "signup" && (
              <p className="text-xs text-muted-foreground">
                Apenas emails {ADMIN_DOMAIN} podem se registrar como admin.
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm">
            {mode === "signin" ? (
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className="text-muted-foreground hover:text-foreground"
              >
                Primeira vez? <span className="text-primary">Criar conta</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(null); }}
                className="text-muted-foreground hover:text-foreground"
              >
                Já tem conta? <span className="text-primary">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
