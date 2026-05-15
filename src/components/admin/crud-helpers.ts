import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/admin-audit";

export type DraftBase = { id: string; _new?: boolean; _dirty?: boolean };

// Persist insert/update/delete arrays for a table with audit logging.
export async function persistTable<T extends DraftBase>(
  table: string,
  rows: T[],
  deleted: T[],
  original: Map<string, T>,
  adminId: string,
) {
  const inserts = rows
    .filter((r) => r._new)
    .map(({ id, _new, _dirty, ...rest }) => rest as unknown as Record<string, unknown>);
  const updates = rows.filter((r) => !r._new && r._dirty);

  if (inserts.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table as any) as any).insert(inserts);
    if (error) throw error;
    await logAudit(adminId, table, "insert", inserts);
  }
  for (const u of updates) {
    const { id, _new, _dirty, ...payload } = u;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table as any) as any).update(payload).eq("id", id);
    if (error) throw error;
    await logAudit(adminId, table, "update", payload, original.get(id));
  }
  for (const d of deleted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", d.id);
    if (error) throw error;
    await logAudit(adminId, table, "delete", null, d);
  }
}
