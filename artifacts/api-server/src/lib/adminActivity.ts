import { db, adminActivityTable, type AdminUser } from "@workspace/db";
import { logger } from "./logger";

export type AdminAction =
  | "auth.login"
  | "auth.failed_login"
  | "customer.created"
  | "customer.updated"
  | "customer.deleted"
  | "customer_message.sent"
  | "chat.sent"
  | "appointment.accepted"
  | "appointment.declined"
  | "appointment.proposed"
  | "staff.created"
  | "staff.invited"
  | "staff.deleted"
  | "staff.password_set"
  | "profile.updated";

export async function logActivity(
  admin: Pick<AdminUser, "id" | "name"> | { id: null; name: string },
  action: AdminAction,
  opts: {
    targetType?: string;
    targetId?: number;
    targetLabel?: string;
    description?: string;
  } = {},
): Promise<void> {
  try {
    await db.insert(adminActivityTable).values({
      adminId: admin.id ?? null,
      adminName: admin.name,
      action,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId ?? null,
      targetLabel: opts.targetLabel ?? null,
      description: opts.description ?? null,
    });
  } catch (err) {
    // Activity logging is best-effort — never block the request on it
    logger.error({ err, action }, "failed to log admin activity");
  }
}
