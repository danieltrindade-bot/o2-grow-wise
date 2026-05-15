import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logAudit } from "@/lib/admin-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type Row = {
  id: string;
  dimension: string;
  question_key: string;
  trigger_color: string;
  label: string;
  pct_min: number | null;
  pct_max: number | null;
  qualitative: boolean;
};
type Draft = Row & { _new?: boolean; _dirty?: boolean };

export function CostsTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleted, setDeleted] = useState<Row[]>([]);
  const original = useMemo(() => new Map<string, Row>(), []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("cost_parameters").select("*").order("dimension");
    if (error) toast.error(error.message);
    else {
      original.clear();
      (data ?? []).forEach((r) => original.set(r.id, r as Row));
      setRows((data ?? []) as Draft[]);
      setDeleted([]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));

  const add = () => {
    const id = `new-${crypto.randomUUID()}`;
    setRows((rs) => [...rs, {
      id, dimension: "", question_key: "", trigger_color: "red",
      label: "", pct_min: null, pct_max: null, qualitative: false,
      _new: true, _dirty: true,
    }]);
  };

  const remove = (id: string) => {
    if (!confirm("Excluir este parâmetro?")) return;
    const row = rows.find((r) => r.id === id);
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setDeleted((d) => [...d, row]);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const inserts = rows.filter((r) => r._new).map(({ id, _new, _dirty, ...r }) => r);
      const updates = rows.filter((r) => !r._new && r._dirty);
      if (inserts.length) {
        const { error } = await supabase.from("cost_parameters").insert(inserts);
        if (error) throw error;
        await logAudit(user.id, "cost_parameters", "insert", inserts);
      }
      for (const u of updates) {
        const { id, _new, _dirty, ...payload } = u;
        const { error } = await supabase.from("cost_parameters").update(payload).eq("id", id);
        if (error) throw error;
        await logAudit(user.id, "cost_parameters", "update", payload, original.get(id));
      }
      for (const d of deleted) {
        const { error } = await supabase.from("cost_parameters").delete().eq("id", d.id);
        if (error) throw error;
        await logAudit(user.id, "cost_parameters", "delete", null, d);
      }
      toast.success("Alterações salvas");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSaving(false);
  };

  const dirty = rows.some((r) => r._dirty) || deleted.length > 0;

  if (loading) return <Loader2 className="animate-spin mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} parâmetros</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={add}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
          <Button onClick={save} disabled={!dirty || saving} className="bg-primary text-primary-foreground">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Dimensão</th>
              <th className="p-2 text-left">Questão</th>
              <th className="p-2 text-left">Cor Gatilho</th>
              <th className="p-2 text-left">Label</th>
              <th className="p-2 text-left w-20">% Mín</th>
              <th className="p-2 text-left w-20">% Máx</th>
              <th className="p-2 text-left w-20">Qualitativo</th>
              <th className="p-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-border ${r._dirty ? "bg-primary/5" : ""}`}>
                <td className="p-2"><Input value={r.dimension} onChange={(e) => update(r.id, { dimension: e.target.value })} /></td>
                <td className="p-2"><Input value={r.question_key} onChange={(e) => update(r.id, { question_key: e.target.value })} /></td>
                <td className="p-2"><Input value={r.trigger_color} onChange={(e) => update(r.id, { trigger_color: e.target.value })} /></td>
                <td className="p-2"><Input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} /></td>
                <td className="p-2"><Input type="number" step="0.01" value={r.pct_min ?? ""} onChange={(e) => update(r.id, { pct_min: e.target.value === "" ? null : Number(e.target.value) })} /></td>
                <td className="p-2"><Input type="number" step="0.01" value={r.pct_max ?? ""} onChange={(e) => update(r.id, { pct_max: e.target.value === "" ? null : Number(e.target.value) })} /></td>
                <td className="p-2"><Checkbox checked={r.qualitative} onCheckedChange={(v) => update(r.id, { qualitative: !!v })} /></td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
