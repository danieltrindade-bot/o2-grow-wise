import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logAudit } from "@/lib/admin-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type Rec = {
  id: string;
  rule_key: string;
  name: string;
  tagline: string;
  score_min: number;
  score_max: number;
  price: number | null;
};
type RecDraft = Rec & { _new?: boolean; _dirty?: boolean };

type Outcome = {
  id: string;
  dimension: string;
  question_key: string;
  current_text: string;
  future_text: string;
  check_red: boolean;
};
type OutDraft = Outcome & { _new?: boolean; _dirty?: boolean };

export function RecommendationsTab() {
  const { user } = useAuth();

  // Recommendations
  const [recs, setRecs] = useState<RecDraft[]>([]);
  const [recDeleted, setRecDeleted] = useState<Rec[]>([]);
  const recOriginal = useMemo(() => new Map<string, Rec>(), []);

  // Outcomes
  const [outs, setOuts] = useState<OutDraft[]>([]);
  const [outDeleted, setOutDeleted] = useState<Outcome[]>([]);
  const outOriginal = useMemo(() => new Map<string, Outcome>(), []);

  const [loading, setLoading] = useState(true);
  const [savingRec, setSavingRec] = useState(false);
  const [savingOut, setSavingOut] = useState(false);

  const load = async () => {
    setLoading(true);
    const [r, o] = await Promise.all([
      supabase.from("product_recommendations").select("*").order("score_min"),
      supabase.from("outcome_texts").select("*").order("dimension"),
    ]);
    if (r.error) toast.error(r.error.message);
    if (o.error) toast.error(o.error.message);
    recOriginal.clear();
    (r.data ?? []).forEach((x) => recOriginal.set(x.id, x as Rec));
    setRecs((r.data ?? []) as RecDraft[]);
    setRecDeleted([]);
    outOriginal.clear();
    (o.data ?? []).forEach((x) => outOriginal.set(x.id, x as Outcome));
    setOuts((o.data ?? []) as OutDraft[]);
    setOutDeleted([]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // --- Recs ops ---
  const updateRec = (id: string, patch: Partial<Rec>) =>
    setRecs((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
  const addRec = () => {
    const id = `new-${crypto.randomUUID()}`;
    setRecs((rs) => [...rs, { id, rule_key: "", name: "", tagline: "", score_min: 0, score_max: 0, price: null, _new: true, _dirty: true }]);
  };
  const removeRec = (id: string) => {
    if (!confirm("Excluir recomendação?")) return;
    const row = recs.find((r) => r.id === id);
    setRecs((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setRecDeleted((d) => [...d, row]);
  };
  const saveRecs = async () => {
    if (!user) return;
    setSavingRec(true);
    try {
      const inserts = recs.filter((r) => r._new).map(({ id, _new, _dirty, ...r }) => r);
      const updates = recs.filter((r) => !r._new && r._dirty);
      if (inserts.length) {
        const { error } = await supabase.from("product_recommendations").insert(inserts);
        if (error) throw error;
        await logAudit(user.id, "product_recommendations", "insert", inserts);
      }
      for (const u of updates) {
        const { id, _new, _dirty, ...payload } = u;
        const { error } = await supabase.from("product_recommendations").update(payload).eq("id", id);
        if (error) throw error;
        await logAudit(user.id, "product_recommendations", "update", payload, recOriginal.get(id));
      }
      for (const d of recDeleted) {
        const { error } = await supabase.from("product_recommendations").delete().eq("id", d.id);
        if (error) throw error;
        await logAudit(user.id, "product_recommendations", "delete", null, d);
      }
      toast.success("Recomendações salvas");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    setSavingRec(false);
  };

  // --- Outcomes ops ---
  const updateOut = (id: string, patch: Partial<Outcome>) =>
    setOuts((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
  const addOut = () => {
    const id = `new-${crypto.randomUUID()}`;
    setOuts((rs) => [...rs, { id, dimension: "", question_key: "", current_text: "", future_text: "", check_red: false, _new: true, _dirty: true }]);
  };
  const removeOut = (id: string) => {
    if (!confirm("Excluir outcome?")) return;
    const row = outs.find((r) => r.id === id);
    setOuts((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setOutDeleted((d) => [...d, row]);
  };
  const saveOuts = async () => {
    if (!user) return;
    setSavingOut(true);
    try {
      const inserts = outs.filter((r) => r._new).map(({ id, _new, _dirty, ...r }) => r);
      const updates = outs.filter((r) => !r._new && r._dirty);
      if (inserts.length) {
        const { error } = await supabase.from("outcome_texts").insert(inserts);
        if (error) throw error;
        await logAudit(user.id, "outcome_texts", "insert", inserts);
      }
      for (const u of updates) {
        const { id, _new, _dirty, ...payload } = u;
        const { error } = await supabase.from("outcome_texts").update(payload).eq("id", id);
        if (error) throw error;
        await logAudit(user.id, "outcome_texts", "update", payload, outOriginal.get(id));
      }
      for (const d of outDeleted) {
        const { error } = await supabase.from("outcome_texts").delete().eq("id", d.id);
        if (error) throw error;
        await logAudit(user.id, "outcome_texts", "delete", null, d);
      }
      toast.success("Outcomes salvos");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    setSavingOut(false);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto mt-8" />;

  const recDirty = recs.some((r) => r._dirty) || recDeleted.length > 0;
  const outDirty = outs.some((r) => r._dirty) || outDeleted.length > 0;

  return (
    <div className="space-y-10">
      {/* Recommendations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recomendações</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addRec}><Plus className="mr-2 h-4 w-4" /> Adicionar Recomendação</Button>
            <Button onClick={saveRecs} disabled={!recDirty || savingRec} className="bg-primary text-primary-foreground">
              {savingRec ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {recs.map((r) => (
            <div key={r.id} className={`rounded-xl border border-border p-4 space-y-3 ${r._dirty ? "bg-primary/5" : "bg-card"}`}>
              <div className="flex items-center justify-between">
                <Input placeholder="Chave (rule_key)" value={r.rule_key} onChange={(e) => updateRec(r.id, { rule_key: e.target.value })} className="max-w-[180px]" />
                <Button size="icon" variant="ghost" onClick={() => removeRec(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button>
              </div>
              <Input placeholder="Nome do serviço" value={r.name} onChange={(e) => updateRec(r.id, { name: e.target.value })} />
              <Textarea placeholder="Tagline" rows={2} value={r.tagline} onChange={(e) => updateRec(r.id, { tagline: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Score mín</p>
                  <Input type="number" value={r.score_min} onChange={(e) => updateRec(r.id, { score_min: Number(e.target.value) })} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Score máx</p>
                  <Input type="number" value={r.score_max} onChange={(e) => updateRec(r.id, { score_max: Number(e.target.value) })} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Preço</p>
                  <Input type="number" value={r.price ?? ""} onChange={(e) => updateRec(r.id, { price: e.target.value === "" ? null : Number(e.target.value) })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Outcomes</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addOut}><Plus className="mr-2 h-4 w-4" /> Adicionar Outcome</Button>
            <Button onClick={saveOuts} disabled={!outDirty || savingOut} className="bg-primary text-primary-foreground">
              {savingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2 text-left w-32">Dimensão</th>
                <th className="p-2 text-left w-40">Questão</th>
                <th className="p-2 text-left">Situação Atual</th>
                <th className="p-2 text-left">Em 90 dias</th>
                <th className="p-2 text-left w-20">Só Red?</th>
                <th className="p-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {outs.map((r) => (
                <tr key={r.id} className={`border-t border-border ${r._dirty ? "bg-primary/5" : ""}`}>
                  <td className="p-2"><Input value={r.dimension} onChange={(e) => updateOut(r.id, { dimension: e.target.value })} /></td>
                  <td className="p-2"><Input value={r.question_key} onChange={(e) => updateOut(r.id, { question_key: e.target.value })} /></td>
                  <td className="p-2"><Textarea rows={2} value={r.current_text} onChange={(e) => updateOut(r.id, { current_text: e.target.value })} /></td>
                  <td className="p-2"><Textarea rows={2} value={r.future_text} onChange={(e) => updateOut(r.id, { future_text: e.target.value })} /></td>
                  <td className="p-2"><Checkbox checked={r.check_red} onCheckedChange={(v) => updateOut(r.id, { check_red: !!v })} /></td>
                  <td className="p-2"><Button size="icon" variant="ghost" onClick={() => removeOut(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
