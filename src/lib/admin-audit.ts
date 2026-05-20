import { insertRows } from "@/lib/local-store";

export type AuditAction = "insert" | "update" | "delete";

export async function logAudit(
  adminId: string,
  tableName: string,
  action: AuditAction,
  newValues: unknown,
  oldValues?: unknown,
) {
  try {
    insertRows("admin_audit_logs", [
      {
        admin_id: adminId,
        table_name: tableName,
        action,
        new_values: newValues,
        old_values: oldValues ?? null,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (e) {
    console.error("audit log failed", e);
  }
}
