import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function Placeholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          O2 Inc
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{subtitle ?? "Em construção"}</p>
        <div className="mt-8">
          <Link to="/">
            <Button variant="outline" className="rounded-md">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
