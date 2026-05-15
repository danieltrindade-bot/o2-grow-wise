import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "insert" | "update" | "delete";

export async function logAudit(
  adminId: string,
  tableName: string,
  action: AuditAction,
  newValues: unknown,
  oldValues?: unknown,
) {
  try {
    await supabase.from("admin_audit_logs").insert({
      admin_id: adminId,
      table_name: tableName,
      action,
      new_values: newValues as never,
      old_values: (oldValues ?? null) as never,
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
