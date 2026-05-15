import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionsTab } from "@/components/admin/QuestionsTab";
import { CostsTab } from "@/components/admin/CostsTab";
import { MaturityTab } from "@/components/admin/MaturityTab";
import { RecommendationsTab } from "@/components/admin/RecommendationsTab";
import { BpoTab } from "@/components/admin/BpoTab";
import { CfoTab } from "@/components/admin/CfoTab";
import { OthersTab } from "@/components/admin/OthersTab";

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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary">Painel</p>
            <h1 className="text-xl font-bold">O2 Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="questions">Perguntas</TabsTrigger>
            <TabsTrigger value="costs">Custos e Perdas</TabsTrigger>
            <TabsTrigger value="maturity">Maturidade</TabsTrigger>
            <TabsTrigger value="recs">Recomendações</TabsTrigger>
            <TabsTrigger value="bpo">BPO Financeiro</TabsTrigger>
            <TabsTrigger value="cfo">CFO as a Service</TabsTrigger>
            <TabsTrigger value="others">Demais Calculadoras</TabsTrigger>
          </TabsList>
          <TabsContent value="questions"><QuestionsTab /></TabsContent>
          <TabsContent value="costs"><CostsTab /></TabsContent>
          <TabsContent value="maturity"><MaturityTab /></TabsContent>
          <TabsContent value="recs"><RecommendationsTab /></TabsContent>
          <TabsContent value="bpo"><BpoTab /></TabsContent>
          <TabsContent value="cfo"><CfoTab /></TabsContent>
          <TabsContent value="others"><OthersTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
