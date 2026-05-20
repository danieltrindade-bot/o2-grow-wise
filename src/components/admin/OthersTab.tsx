import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Plus, Trash2, Info } from "lucide-react";
import { selectAll, updateRow } from "@/lib/local-store";
import { useAuth } from "@/context/AuthContext";
import { logAudit } from "@/lib/admin-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { persistTable, type DraftBase } from "./crud-helpers";

type Setup = DraftBase & { label: string; min_revenue: number; max_revenue: number | null; price_standard: number; price_complex: number; sort_order: number };
type AssRow = DraftBase & { label: string; min_revenue: number; max_revenue: number | null; base_price: number; sort_order: number };
type AssSettings = { id: string; cnpj_adjustment: number; min_price: number; max_price: number };

export function OthersTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [setups, setSetups] = useState<Setup[]>([]);
  const [setupDeleted, setSetupDeleted] = useState<Setup[]>([]);
  const setupOriginal = useMemo(() => new Map<string, Setup>(), []);

  const [ass, setAss] = useState<AssRow[]>([]);
  const [assDeleted, setAssDeleted] = useState<AssRow[]>([]);
  const assOriginal = useMemo(() => new Map<string, AssRow>(), []);

  const [settings, setSettings] = useState<AssSettings | null>(null);
  const [settingsOriginal, setSettingsOriginal] = useState<AssSettings | null>(null);
  const [settingsDirty, setSettingsDirty] = useState(false);

  const load = () => {
    setLoading(true);
    const sData = selectAll<Setup>("setup_pricing_rules", "sort_order");
    setupOriginal.clear();
    sData.forEach((r) => setupOriginal.set(r.id, r));
    setSetups(sData);
    setSetupDeleted([]);
    const aData = selectAll<AssRow>("assessoria_pricing_rules", "sort_order");
    assOriginal.clear();
    aData.forEach((r) => assOriginal.set(r.id, r));
    setAss(aData);
    setAssDeleted([]);
    const stData = selectAll<AssSettings>("assessoria_settings");
    const stFirst = stData[0] ?? null;
    setSettings(stFirst);
    setSettingsOriginal(stFirst);
    setSettingsDirty(false);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // setup ops
  const updSetup = (id: string, p: Partial<Setup>) => setSetups((rs) => rs.map((r) => r.id === id ? { ...r, ...p, _dirty: true } : r));
  const addSetup = () => setSetups((rs) => [...rs, {
    id: `new-${crypto.randomUUID()}`, label: "", min_revenue: 0, max_revenue: null,
    price_standard: 0, price_complex: 0, sort_order: rs.length, _new: true, _dirty: true,
  }]);
  const removeSetup = (id: string) => {
    if (!confirm("Excluir?")) return;
    const row = setups.find((r) => r.id === id);
    setSetups((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setSetupDeleted((d) => [...d, row]);
  };

  // assessoria ops
  const updAss = (id: string, p: Partial<AssRow>) => setAss((rs) => rs.map((r) => r.id === id ? { ...r, ...p, _dirty: true } : r));
  const addAss = () => setAss((rs) => [...rs, {
    id: `new-${crypto.randomUUID()}`, label: "", min_revenue: 0, max_revenue: null,
    base_price: 0, sort_order: rs.length, _new: true, _dirty: true,
  }]);
  const removeAss = (id: string) => {
    if (!confirm("Excluir?")) return;
    const row = ass.find((r) => r.id === id);
    setAss((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setAssDeleted((d) => [...d, row]);
  };

  const updateSetting = (patch: Partial<AssSettings>) => {
    setSettings((s) => s ? { ...s, ...patch } : s);
    setSettingsDirty(true);
  };

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await persistTable("setup_pricing_rules", setups, setupDeleted, setupOriginal, user.id);
      await persistTable("assessoria_pricing_rules", ass, assDeleted, assOriginal, user.id);
      if (settingsDirty && settings) {
        const { id, ...payload } = settings;
        updateRow("assessoria_settings", id, payload);
        await logAudit(user.id, "assessoria_settings", "update", payload, settingsOriginal);
      }
      queryClient.invalidateQueries();
      toast.success("Configurações salvas");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto mt-8" />;

  const dirty = setups.some((r) => r._dirty) || setupDeleted.length > 0
    || ass.some((r) => r._dirty) || assDeleted.length > 0 || settingsDirty;

  const num = (value: number | null, onChange: (v: number | null) => void, nullable = false) =>
    <Input type="number" step="0.01" value={value ?? ""} onChange={(e) => {
      const raw = e.target.value;
      if (nullable && raw === "") onChange(null); else onChange(Number(raw));
    }} />;

  const headerCls = "p-2 text-left text-xs uppercase text-muted-foreground";
  const rowCls = (d?: boolean) => `border-t border-border ${d ? "bg-primary/5" : ""}`;

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={!dirty || saving} className="bg-primary text-primary-foreground">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Oxy + Gênio e Coordenador</h2>
          <Button variant="outline" onClick={addSetup}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 text-primary" />
          Oxy+Gênio e Coordenador compartilham a mesma tabela de preços (setup_pricing_rules).
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>
              <th className={headerCls}>Label</th><th className={headerCls}>Min</th><th className={headerCls}>Max</th>
              <th className={headerCls}>Padrão</th><th className={headerCls}>Complexo</th><th className="w-12" />
            </tr></thead>
            <tbody>{setups.map((r) => (
              <tr key={r.id} className={rowCls(r._dirty)}>
                <td className="p-2"><Input value={r.label} onChange={(e) => updSetup(r.id, { label: e.target.value })} /></td>
                <td className="p-2">{num(r.min_revenue, (v) => updSetup(r.id, { min_revenue: v ?? 0 }))}</td>
                <td className="p-2">{num(r.max_revenue, (v) => updSetup(r.id, { max_revenue: v }), true)}</td>
                <td className="p-2">{num(r.price_standard, (v) => updSetup(r.id, { price_standard: v ?? 0 }))}</td>
                <td className="p-2">{num(r.price_complex, (v) => updSetup(r.id, { price_complex: v ?? 0 }))}</td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => removeSetup(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Assessoria Estratégica — Faixas</h2>
          <Button variant="outline" onClick={addAss}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>
              <th className={headerCls}>Label</th><th className={headerCls}>Min</th>
              <th className={headerCls}>Max</th><th className={headerCls}>Preço base</th><th className="w-12" />
            </tr></thead>
            <tbody>{ass.map((r) => (
              <tr key={r.id} className={rowCls(r._dirty)}>
                <td className="p-2"><Input value={r.label} onChange={(e) => updAss(r.id, { label: e.target.value })} /></td>
                <td className="p-2">{num(r.min_revenue, (v) => updAss(r.id, { min_revenue: v ?? 0 }))}</td>
                <td className="p-2">{num(r.max_revenue, (v) => updAss(r.id, { max_revenue: v }), true)}</td>
                <td className="p-2">{num(r.base_price, (v) => updAss(r.id, { base_price: v ?? 0 }))}</td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={() => removeAss(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button></td>
              </tr>))}
            </tbody>
          </table>
        </div>

        {settings && (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-1">Ajuste por CNPJ adicional (R$)</p>
              {num(settings.cnpj_adjustment, (v) => updateSetting({ cnpj_adjustment: v ?? 0 }))}
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-1">Valor mínimo (R$)</p>
              {num(settings.min_price, (v) => updateSetting({ min_price: v ?? 0 }))}
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-1">Valor máximo (R$)</p>
              {num(settings.max_price, (v) => updateSetting({ max_price: v ?? 0 }))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
