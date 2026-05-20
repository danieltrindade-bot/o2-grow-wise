import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { selectAll } from "@/lib/local-store";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { persistTable, type DraftBase } from "./crud-helpers";

type Base = DraftBase & { label: string; min_revenue: number; max_revenue: number | null; base_price: number; sort_order: number };
type Cnpj = DraftBase & { cnpj_count: number; multiplier: number };
type Cmplx = DraftBase & { level: string; min_score: number; max_score: number; factor: number };
type Seg = DraftBase & { segment_type: string; adjustment: number };
type Gov = DraftBase & { governance_type: string; fee: number };
type Setup = DraftBase & { label: string; min_revenue: number; max_revenue: number | null; price_standard: number; price_complex: number; sort_order: number };

function useTable<T extends DraftBase>(table: string, orderBy?: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [deleted, setDeleted] = useState<T[]>([]);
  const original = useMemo(() => new Map<string, T>(), []);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    const data = selectAll<T>(table, orderBy);
    original.clear();
    data.forEach((r) => original.set(r.id, r));
    setRows(data);
    setDeleted([]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const update = (id: string, patch: Partial<T>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
  const add = (defaults: Omit<T, "id" | "_new" | "_dirty">) =>
    setRows((rs) => [...rs, { ...defaults, id: `new-${crypto.randomUUID()}`, _new: true, _dirty: true } as T]);
  const remove = (id: string) => {
    if (!confirm("Excluir?")) return;
    const row = rows.find((r) => r.id === id);
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setDeleted((d) => [...d, row]);
  };
  const dirty = rows.some((r) => r._dirty) || deleted.length > 0;
  return { rows, setRows, deleted, original, loading, load, update, add, remove, dirty };
}

function NumInput({ value, onChange, nullable = false }: { value: number | null; onChange: (v: number | null) => void; nullable?: boolean }) {
  return <Input type="number" step="0.01" value={value ?? ""} onChange={(e) => {
    const raw = e.target.value;
    if (nullable && raw === "") onChange(null);
    else onChange(Number(raw));
  }} />;
}

export function CfoTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const base = useTable<Base>("cfo_base_rules", "sort_order");
  const cnpj = useTable<Cnpj>("cfo_cnpj_rules", "cnpj_count");
  const cmplx = useTable<Cmplx>("cfo_complexity_rules", "min_score");
  const seg = useTable<Seg>("cfo_segment_rules");
  const gov = useTable<Gov>("cfo_governance_rules");
  const setup = useTable<Setup>("setup_pricing_rules", "sort_order");
  const [saving, setSaving] = useState(false);

  const loading = base.loading || cnpj.loading || cmplx.loading || seg.loading || gov.loading || setup.loading;
  const dirty = base.dirty || cnpj.dirty || cmplx.dirty || seg.dirty || gov.dirty || setup.dirty;

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await persistTable("cfo_base_rules", base.rows, base.deleted, base.original, user.id);
      await persistTable("cfo_cnpj_rules", cnpj.rows, cnpj.deleted, cnpj.original, user.id);
      await persistTable("cfo_complexity_rules", cmplx.rows, cmplx.deleted, cmplx.original, user.id);
      await persistTable("cfo_segment_rules", seg.rows, seg.deleted, seg.original, user.id);
      await persistTable("cfo_governance_rules", gov.rows, gov.deleted, gov.original, user.id);
      await persistTable("setup_pricing_rules", setup.rows, setup.deleted, setup.original, user.id);
      queryClient.invalidateQueries();
      toast.success("Regras CFO salvas");
      await Promise.all([base.load(), cnpj.load(), cmplx.load(), seg.load(), gov.load(), setup.load()]);
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto mt-8" />;

  const headerCls = "p-2 text-left text-xs uppercase text-muted-foreground";
  const rowCls = (d?: boolean) => `border-t border-border ${d ? "bg-primary/5" : ""}`;

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={!dirty || saving} className="bg-primary text-primary-foreground">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Todas as Regras
        </Button>
      </div>

      {/* Base Price */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Preço Base por Faturamento</h2>
          <Button variant="outline" onClick={() => base.add({ label: "", min_revenue: 0, max_revenue: null, base_price: 0, sort_order: base.rows.length })}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>
              <th className={headerCls}>Label</th><th className={headerCls}>Min</th>
              <th className={headerCls}>Max</th><th className={headerCls}>Preço base</th>
              <th className={headerCls + " w-20"}>Ordem</th><th className="w-12" />
            </tr></thead>
            <tbody>{base.rows.map((r) => (
              <tr key={r.id} className={rowCls(r._dirty)}>
                <td className="p-2"><Input value={r.label} onChange={(e) => base.update(r.id, { label: e.target.value })} /></td>
                <td className="p-2"><NumInput value={r.min_revenue} onChange={(v) => base.update(r.id, { min_revenue: v ?? 0 })} /></td>
                <td className="p-2"><NumInput nullable value={r.max_revenue} onChange={(v) => base.update(r.id, { max_revenue: v })} /></td>
                <td className="p-2"><NumInput value={r.base_price} onChange={(v) => base.update(r.id, { base_price: v ?? 0 })} /></td>
                <td className="p-2"><NumInput value={r.sort_order} onChange={(v) => base.update(r.id, { sort_order: v ?? 0 })} /></td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => base.remove(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CNPJ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Multiplicador por CNPJs</h2>
          <Button variant="outline" onClick={() => cnpj.add({ cnpj_count: 1, multiplier: 1 })}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr><th className={headerCls}>CNPJs</th><th className={headerCls}>Multiplicador</th><th className="w-12" /></tr></thead>
            <tbody>{cnpj.rows.map((r) => (
              <tr key={r.id} className={rowCls(r._dirty)}>
                <td className="p-2 w-32"><NumInput value={r.cnpj_count} onChange={(v) => cnpj.update(r.id, { cnpj_count: v ?? 0 })} /></td>
                <td className="p-2 w-40"><NumInput value={r.multiplier} onChange={(v) => cnpj.update(r.id, { multiplier: v ?? 0 })} /></td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => cnpj.remove(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Complexity */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fator de Complexidade</h2>
          <Button variant="outline" onClick={() => cmplx.add({ level: "", min_score: 0, max_score: 0, factor: 1 })}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>
              <th className={headerCls}>Nível</th><th className={headerCls}>Score mín</th>
              <th className={headerCls}>Score máx</th><th className={headerCls}>Fator</th><th className="w-12" />
            </tr></thead>
            <tbody>{cmplx.rows.map((r) => (
              <tr key={r.id} className={rowCls(r._dirty)}>
                <td className="p-2"><Input value={r.level} onChange={(e) => cmplx.update(r.id, { level: e.target.value })} /></td>
                <td className="p-2 w-28"><NumInput value={r.min_score} onChange={(v) => cmplx.update(r.id, { min_score: v ?? 0 })} /></td>
                <td className="p-2 w-28"><NumInput value={r.max_score} onChange={(v) => cmplx.update(r.id, { max_score: v ?? 0 })} /></td>
                <td className="p-2 w-28"><NumInput value={r.factor} onChange={(v) => cmplx.update(r.id, { factor: v ?? 0 })} /></td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => cmplx.remove(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Segment */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ajuste por Segmento (%)</h2>
          <Button variant="outline" onClick={() => seg.add({ segment_type: "", adjustment: 0 })}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr><th className={headerCls}>Tipo</th><th className={headerCls}>Ajuste (%)</th><th className="w-12" /></tr></thead>
            <tbody>{seg.rows.map((r) => (
              <tr key={r.id} className={rowCls(r._dirty)}>
                <td className="p-2"><Input value={r.segment_type} onChange={(e) => seg.update(r.id, { segment_type: e.target.value })} /></td>
                <td className="p-2 w-40"><NumInput value={r.adjustment} onChange={(v) => seg.update(r.id, { adjustment: v ?? 0 })} /></td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => seg.remove(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Governance */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Taxa de Governança (R$)</h2>
          <Button variant="outline" onClick={() => gov.add({ governance_type: "", fee: 0 })}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr><th className={headerCls}>Tipo</th><th className={headerCls}>Valor (R$)</th><th className="w-12" /></tr></thead>
            <tbody>{gov.rows.map((r) => (
              <tr key={r.id} className={rowCls(r._dirty)}>
                <td className="p-2"><Input value={r.governance_type} onChange={(e) => gov.update(r.id, { governance_type: e.target.value })} /></td>
                <td className="p-2 w-40"><NumInput value={r.fee} onChange={(v) => gov.update(r.id, { fee: v ?? 0 })} /></td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => gov.remove(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Setup */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Setup (Padrão / Complexo)</h2>
          <Button variant="outline" onClick={() => setup.add({ label: "", min_revenue: 0, max_revenue: null, price_standard: 0, price_complex: 0, sort_order: setup.rows.length })}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>
              <th className={headerCls}>Label</th><th className={headerCls}>Min</th><th className={headerCls}>Max</th>
              <th className={headerCls}>Padrão</th><th className={headerCls}>Complexo</th>
              <th className={headerCls + " w-20"}>Ordem</th><th className="w-12" />
            </tr></thead>
            <tbody>{setup.rows.map((r) => (
              <tr key={r.id} className={rowCls(r._dirty)}>
                <td className="p-2"><Input value={r.label} onChange={(e) => setup.update(r.id, { label: e.target.value })} /></td>
                <td className="p-2"><NumInput value={r.min_revenue} onChange={(v) => setup.update(r.id, { min_revenue: v ?? 0 })} /></td>
                <td className="p-2"><NumInput nullable value={r.max_revenue} onChange={(v) => setup.update(r.id, { max_revenue: v })} /></td>
                <td className="p-2"><NumInput value={r.price_standard} onChange={(v) => setup.update(r.id, { price_standard: v ?? 0 })} /></td>
                <td className="p-2"><NumInput value={r.price_complex} onChange={(v) => setup.update(r.id, { price_complex: v ?? 0 })} /></td>
                <td className="p-2"><NumInput value={r.sort_order} onChange={(v) => setup.update(r.id, { sort_order: v ?? 0 })} /></td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => setup.remove(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
