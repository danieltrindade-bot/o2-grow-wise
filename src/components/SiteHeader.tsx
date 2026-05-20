import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/diagnostico", label: "Diagnóstico" },
  { to: "/reunioes", label: "Reuniões" },
  { to: "/servicos", label: "Serviços" },
] as const;

export function SiteHeader() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const isAdmin = role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">O2</span>
          <span className="hidden sm:inline">O2 Inc</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "px-3 py-2 text-sm text-foreground font-medium" }}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Admin"
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden border-t border-border bg-background overflow-hidden transition-all",
          open ? "max-h-64" : "max-h-0",
        )}
      >
        <nav className="flex flex-col px-4 py-2">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="py-2 text-sm">
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="py-2 text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function ScrollToTop() {
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [loc.pathname]);
  return null;
}