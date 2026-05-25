import { Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        <Link to="/" className="flex items-center">
          <img src="/logo-o2-white.png" alt="O2 Inc" className="h-8" />
        </Link>
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