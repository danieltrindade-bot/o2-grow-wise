import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { selectAll, updateRow } from "@/lib/local-store";
import { useAuth } from "@/context/AuthContext";
import { logAudit } from "@/lib/admin-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { persistTable, type DraftBase } from "./crud-helpers";

type Setting = { id: string; key: string; value: unknown };
type Pkg = DraftBase & {
  name: string; description: string | null;
  price_tier_1: number; price_tier_2: number; price_tier_3: number;
  display_order: number;
};
type SetupMod = DraftBase & {
  name: string; is_active: boolean; is_mandatory: boolean;
  installments: number; installment_value: number; add_to_monthly: boolean;
};

const SETTING_KEYS: Array<{ key: string; label: string }> = [
  { key: "dias_uteis", label: "Dias úteis" },
  { key: "tier_1_limit", label: "Limite Tier 1" },
  { key: "tier_2_limit", label: "Limite Tier 2" },
];

export function BpoTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<Record<string, number>>({});
  const [settingsOriginal, setSettingsOriginal] = useState<Record<string, { id: string; value: number }>>({});
  const [settingsDirty, setSettingsDirty] = useState(false);

  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [pkgDeleted, setPkgDeleted] = useState<Pkg[]>([]);
  const pkgOriginal = useMemo(() => new Map<string, Pkg>(), []);

  const [setups, setSetups] = useState<SetupMod[]>([]);
  const [setupDeleted, setSetupDeleted] = useState<SetupMod[]>([]);
  const setupOriginal = useMemo(() => new Map<string, SetupMod>(), []);

  const load = () => {
    setLoading(true);
    const sData = selectAll<Setting>("bpo_settings");
    const pData = selectAll<Pkg>("bpo_packages", "display_order");
    const mData = selectAll<SetupMod>("bpo_setup_module");

    const map: Record<string, number> = {};
    const orig: Record<string, { id: string; value: number }> = {};
    sData.forEach((row) => {
      const v = typeof row.value === "number" ? row.value : Number(row.value);
      map[row.key] = v;
      orig[row.key] = { id: row.id, value: v };
    });
    setSettings(map);
    setSettingsOriginal(orig);
    setSettingsDirty(false);

    pkgOriginal.clear();
    pData.forEach((r) => pkgOriginal.set(r.id, r));
    setPkgs(pData);
    setPkgDeleted([]);

    setupOriginal.clear();
    mData.forEach((r) => setupOriginal.set(r.id, r));
    setSetups(mData);
    setSetupDeleted([]);

    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updatePkg = (id: string, patch: Partial<Pkg>) =>
    setPkgs((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
  const addPkg = () => setPkgs((rs) => [...rs, {
    id: `new-${crypto.randomUUID()}`, name: "", description: "",
    price_tier_1: 0, price_tier_2: 0, price_tier_3: 0,
    display_order: rs.length, _new: true, _dirty: true,
  }]);
  const removePkg = (id: string) => {
    if (!confirm("Excluir pacote?")) return;
    const row = pkgs.find((r) => r.id === id);
    setPkgs((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setPkgDeleted((d) => [...d, row]);
  };

  const updateSetup = (id: string, patch: Partial<SetupMod>) =>
    setSetups((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
  const addSetup = () => setSetups((rs) => [...rs, {
    id: `new-${crypto.randomUUID()}`, name: "", is_active: true, is_mandatory: true,
    installments: 12, installment_value: 0, add_to_monthly: true,
    _new: true, _dirty: true,
  }]);
  const removeSetup = (id: string) => {
    if (!confirm("Excluir setup module?")) return;
    const row = setups.find((r) => r.id === id);
    setSetups((rs) => rs.filter((r) => r.id !== id));
    if (row && !row._new) setSetupDeleted((d) => [...d, row]);
  };

  const updateSetting = (key: string, v: number) => {
    setSettings((s) => ({ ...s, [key]: v }));
    setSettingsDirty(true);
  };

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (settingsDirty) {
        for (const { key } of SETTING_KEYS) {
          const orig = settingsOriginal[key];
          const cur = settings[key];
          if (orig && orig.value !== cur) {
            updateRow("bpo_settings", orig.id, { value: cur });
            await logAudit(user.id, "bpo_settings", "update", { key, value: cur }, { key, value: orig.value });
          }
        }
      }
      await persistTable("bpo_packages", pkgs, pkgDeleted, pkgOriginal, user.id);
      await persistTable("bpo_setup_module", setups, setupDeleted, setupOriginal, user.id);
      queryClient.invalidateQueries();
      toast.success("Configurações BPO salvas");
      load();
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto mt-8" />;
  const dirty = settingsDirty || pkgs.some((r) => r._dirty) || pkgDeleted.length > 0
    || setups.some((r) => r._dirty) || setupDeleted.length > 0;

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={!dirty || saving} className="bg-primary text-primary-foreground">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Todas as Configurações
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Configurações Gerais</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {SETTING_KEYS.map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <Input type="number" step="0.01" value={settings[key] ?? 0}
                onChange={(e) => updateSetting(key, Number(e.target.value))} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pacotes</h2>
          <Button variant="outline" onClick={addPkg}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {pkgs.map((p) => (
            <div key={p.id} className={`rounded-xl border border-border p-4 space-y-3 ${p._dirty ? "bg-primary/5" : "bg-card"}`}>
              <div className="flex items-center justify-between">
                <Input placeholder="Nome" value={p.name} onChange={(e) => updatePkg(p.id, { name: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => removePkg(p.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button>
              </div>
              <Textarea placeholder="Descrição" rows={2} value={p.description ?? ""} onChange={(e) => updatePkg(p.id, { description: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <div><p className="text-xs text-muted-foreground mb-1">Tier 1</p>
                  <Input type="number" value={p.price_tier_1} onChange={(e) => updatePkg(p.id, { price_tier_1: Number(e.target.value) })} /></div>
                <div><p className="text-xs text-muted-foreground mb-1">Tier 2</p>
                  <Input type="number" value={p.price_tier_2} onChange={(e) => updatePkg(p.id, { price_tier_2: Number(e.target.value) })} /></div>
                <div><p className="text-xs text-muted-foreground mb-1">Tier 3</p>
                  <Input type="number" value={p.price_tier_3} onChange={(e) => updatePkg(p.id, { price_tier_3: Number(e.target.value) })} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Setup Module</h2>
          <Button variant="outline" onClick={addSetup}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {setups.map((s) => (
            <div key={s.id} className={`rounded-xl border border-border p-4 space-y-3 ${s._dirty ? "bg-primary/5" : "bg-card"}`}>
              <div className="flex items-center justify-between">
                <Input placeholder="Nome" value={s.name} onChange={(e) => updateSetup(s.id, { name: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => removeSetup(s.id)}><Trash2 className="h-4 w-4 text-[var(--color-critical)]" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-muted-foreground mb-1">Parcelas</p>
                  <Input type="number" value={s.installments} onChange={(e) => updateSetup(s.id, { installments: Number(e.target.value) })} /></div>
                <div><p className="text-xs text-muted-foreground mb-1">Valor da parcela</p>
                  <Input type="number" value={s.installment_value} onChange={(e) => updateSetup(s.id, { installment_value: Number(e.target.value) })} /></div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><Checkbox checked={s.is_active} onCheckedChange={(v) => updateSetup(s.id, { is_active: !!v })} /> Ativo</label>
                <label className="flex items-center gap-2"><Checkbox checked={s.is_mandatory} onCheckedChange={(v) => updateSetup(s.id, { is_mandatory: !!v })} /> Obrigatório</label>
                <label className="flex items-center gap-2"><Checkbox checked={s.add_to_monthly} onCheckedChange={(v) => updateSetup(s.id, { add_to_monthly: !!v })} /> Adicionar ao mensal</label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
