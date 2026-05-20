import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { selectAll } from "@/lib/local-store";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { persistTable, type DraftBase } from "./crud-helpers";

type Draft = DraftBase & {
  sort_order: number;
  level_key: string;
  label: string;
  description: string;
  color: string;
  score_min: number;
  score_max: number;
};

export function MaturityTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleted, setDeleted] = useState<Draft[]>([]);
  const original = useMemo(() => new Map<string, Draft>(), []);

  const load = () => {
    setLoading(true);
    const data = selectAll<Draft>("maturity_levels", "sort_order");
    original.clear();
    data.forEach((r) => original.set(r.id, r));
    setRows(data);
    setDeleted([]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Draft>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));

  const add = () => {
    const id = `new-${crypto.randomUUID()}`;
    setRows((rs) => [...rs, {
      id, sort_order: (rs.at(-1)?.sort_order ?? 0) + 1,
      level_key: "", label: "", description: "", color: "#00E85F",
      score_min: 0, score_max: 0, _new: true, _dirty: true,
    }]);
  };

  const remove = (id: string) => {
    if (!confirm("Excluir nível?")) return;
    const row = rows.find((r) => r.id === id);
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setDeleted((d) => [...d, row]);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await persistTable("maturity_levels", rows, deleted, original, user.id);
      queryClient.invalidateQueries();
      toast.success("Alterações salvas");
      load();
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  };

  const dirty = rows.some((r) => r._dirty) || deleted.length > 0;
  if (loading) return <Loader2 className="animate-spin mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} níveis</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={add}><Plus className="mr-2 h-4 w-4" /> Adicionar Nível</Button>
          <Button onClick={save} disabled={!dirty || saving} className="bg-primary text-primary-foreground">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border p-4 bg-muted/20">
        <p className="text-xs uppercase text-muted-foreground mb-3">Preview</p>
        <div className="flex flex-wrap gap-2">
          {rows.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${r.color}22`, color: r.color, border: `1px solid ${r.color}` }}
            >
              {r.label || "(sem label)"} · {r.score_min}-{r.score_max}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left w-16">Ordem</th>
              <th className="p-2 text-left">Chave</th>
              <th className="p-2 text-left">Label</th>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left w-24">Cor</th>
              <th className="p-2 text-left w-20">Score Mín</th>
              <th className="p-2 text-left w-20">Score Máx</th>
              <th className="p-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-border ${r._dirty ? "bg-primary/5" : ""}`}>
                <td className="p-2"><Input type="number" value={r.sort_order} onChange={(e) => update(r.id, { sort_order: Number(e.target.value) })} /></td>
                <td className="p-2"><Input value={r.level_key} onChange={(e) => update(r.id, { level_key: e.target.value })} /></td>
                <td className="p-2"><Input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} /></td>
                <td className="p-2"><Textarea rows={2} value={r.description} onChange={(e) => update(r.id, { description: e.target.value })} /></td>
                <td className="p-2">
                  <input type="color" value={r.color} onChange={(e) => update(r.id, { color: e.target.value })} className="h-9 w-full rounded border border-border bg-transparent" />
                </td>
                <td className="p-2"><Input type="number" value={r.score_min} onChange={(e) => update(r.id, { score_min: Number(e.target.value) })} /></td>
                <td className="p-2"><Input type="number" value={r.score_max} onChange={(e) => update(r.id, { score_max: Number(e.target.value) })} /></td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
