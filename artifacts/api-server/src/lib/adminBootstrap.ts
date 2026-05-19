import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { logger } from "./logger";

/**
 * On server start: ensure a super-admin (NIWEWorker) exists.
 *
 * - Reads ADMIN_USERNAME / ADMIN_PASSWORD from env.
 * - If no super-admin exists, creates one.
 * - If a super-admin with that username already exists, syncs its password hash
 *   to the env value so the env remains the source of truth for the NIWEWorker
 *   account (the user can rotate the secret without touching the DB).
 *
 * Non-super-admin staff accounts manage their own passwords via the admin UI.
 */
export async function ensureSuperAdmin(): Promise<void> {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in production.");
    }
    logger.warn("ADMIN_USERNAME/ADMIN_PASSWORD not set — super-admin bootstrap skipped (dev only).");
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const existing = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(adminUsersTable).values({
      username,
      passwordHash: hash,
      name: "NIWEWorker",
      email: process.env.ADMIN_EMAIL?.trim() || "info@niwe-events.com",
      isSuperAdmin: true,
    });
    logger.info({ username }, "super-admin created from env");
    return;
  }

  // Keep the env-driven super-admin password in sync.
  const current = existing[0]!;
  const matches = current.passwordHash
    ? await bcrypt.compare(password, current.passwordHash)
    : false;
  if (!matches || !current.isSuperAdmin) {
    await db
      .update(adminUsersTable)
      .set({ passwordHash: hash, isSuperAdmin: true })
      .where(eq(adminUsersTable.id, current.id));
    logger.info({ username }, "super-admin password/role synced from env");
  }
}
