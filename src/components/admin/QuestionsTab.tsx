import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logAudit } from "@/lib/admin-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Row = {
  id: string;
  global_order: number;
  dimension: string;
  question_key: string;
  question_text: string;
  option_green: string;
  option_yellow: string;
  option_red: string;
};

type Draft = Row & { _new?: boolean; _dirty?: boolean };

export function QuestionsTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleted, setDeleted] = useState<Row[]>([]);
  const original = useMemo(() => new Map<string, Row>(), []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("diagnostic_questions")
      .select("*")
      .order("global_order");
    if (error) toast.error(error.message);
    else {
      original.clear();
      (data ?? []).forEach((r) => original.set(r.id, r as Row));
      setRows((data ?? []) as Draft[]);
      setDeleted([]);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const update = (id: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
  };

  const add = () => {
    const id = `new-${crypto.randomUUID()}`;
    setRows((rs) => [
      ...rs,
      {
        id,
        global_order: (rs.at(-1)?.global_order ?? 0) + 1,
        dimension: "",
        question_key: "",
        question_text: "",
        option_green: "",
        option_yellow: "",
        option_red: "",
        _new: true,
        _dirty: true,
      },
    ]);
  };

  const remove = (id: string) => {
    if (!confirm("Excluir esta pergunta?")) return;
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
        const { error } = await supabase.from("diagnostic_questions").insert(inserts);
        if (error) throw error;
        await logAudit(user.id, "diagnostic_questions", "insert", inserts);
      }
      for (const u of updates) {
        const { id, _new, _dirty, ...payload } = u;
        const { error } = await supabase
          .from("diagnostic_questions")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        await logAudit(user.id, "diagnostic_questions", "update", payload, original.get(id));
      }
      for (const d of deleted) {
        const { error } = await supabase
          .from("diagnostic_questions")
          .delete()
          .eq("id", d.id);
        if (error) throw error;
        await logAudit(user.id, "diagnostic_questions", "delete", null, d);
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
        <p className="text-sm text-muted-foreground">{rows.length} perguntas</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={add}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Pergunta
          </Button>
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
              <th className="p-2 text-left w-16">Ordem</th>
              <th className="p-2 text-left w-32">Dimensão</th>
              <th className="p-2 text-left w-40">Chave</th>
              <th className="p-2 text-left">Pergunta</th>
              <th className="p-2 text-left">Verde</th>
              <th className="p-2 text-left">Amarela</th>
              <th className="p-2 text-left">Vermelha</th>
              <th className="p-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-border ${r._dirty ? "bg-primary/5" : ""}`}>
                <td className="p-2">
                  <Input
                    type="number"
                    value={r.global_order}
                    onChange={(e) => update(r.id, { global_order: Number(e.target.value) })}
                    className="w-16"
                  />
                </td>
                <td className="p-2">
                  <Input value={r.dimension} onChange={(e) => update(r.id, { dimension: e.target.value })} />
                </td>
                <td className="p-2">
                  <Input value={r.question_key} onChange={(e) => update(r.id, { question_key: e.target.value })} />
                </td>
                <td className="p-2">
                  <Input value={r.question_text} onChange={(e) => update(r.id, { question_text: e.target.value })} />
                </td>
                <td className="p-2">
                  <Input value={r.option_green} onChange={(e) => update(r.id, { option_green: e.target.value })} />
                </td>
                <td className="p-2">
                  <Input value={r.option_yellow} onChange={(e) => update(r.id, { option_yellow: e.target.value })} />
                </td>
                <td className="p-2">
                  <Input value={r.option_red} onChange={(e) => update(r.id, { option_red: e.target.value })} />
                </td>
                <td className="p-2">
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 text-[var(--color-critical)]" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
