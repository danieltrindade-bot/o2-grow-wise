import { insertRows, updateRow, deleteRow } from "@/lib/local-store";
import { logAudit } from "@/lib/admin-audit";

export type DraftBase = { id: string; _new?: boolean; _dirty?: boolean };

export async function persistTable<T extends DraftBase>(
  table: string,
  rows: T[],
  deleted: T[],
  original: Map<string, T>,
  adminId: string,
) {
  const inserts = rows
    .filter((r) => r._new)
    .map(({ _new, _dirty, ...rest }) => rest as unknown as Record<string, unknown>);
  const updates = rows.filter((r) => !r._new && r._dirty);

  if (inserts.length) {
    insertRows(table, inserts as any[]);
    await logAudit(adminId, table, "insert", inserts);
  }
  for (const u of updates) {
    const { id, _new, _dirty, ...payload } = u;
    updateRow(table, id, payload);
    await logAudit(adminId, table, "update", payload, original.get(id));
  }
  for (const d of deleted) {
    deleteRow(table, d.id);
    await logAudit(adminId, table, "delete", null, d);
  }
}
