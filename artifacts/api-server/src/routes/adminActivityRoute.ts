import { Router, type IRouter } from "express";
import { desc, eq, and, sql } from "drizzle-orm";
import { db, adminActivityTable, adminUsersTable } from "@workspace/db";
import { requireSuperAdmin } from "../lib/authMiddleware";

const router: IRouter = Router();

router.get("/admin/activity", requireSuperAdmin, async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10) || 100, 500);
  const adminIdRaw = req.query.adminId;
  const adminId = typeof adminIdRaw === "string" && adminIdRaw ? parseInt(adminIdRaw, 10) : null;

  const where = adminId && Number.isFinite(adminId)
    ? and(eq(adminActivityTable.adminId, adminId))
    : undefined;

  const rows = await db
    .select()
    .from(adminActivityTable)
    .where(where)
    .orderBy(desc(adminActivityTable.createdAt))
    .limit(limit);

  res.json(
    rows.map((r) => ({
      id: r.id,
      adminId: r.adminId,
      adminName: r.adminName,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      targetLabel: r.targetLabel,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.get("/admin/activity/by-admin", requireSuperAdmin, async (_req, res): Promise<void> => {
  // Per-admin counts for the leaderboard view
  const rows = await db
    .select({
      adminId: adminActivityTable.adminId,
      adminName: adminActivityTable.adminName,
      total: sql<number>`count(*)::int`,
      lastAt: sql<Date>`max(${adminActivityTable.createdAt})`,
    })
    .from(adminActivityTable)
    .groupBy(adminActivityTable.adminId, adminActivityTable.adminName);

  // also bring staff that have no activity yet
  const staff = await db
    .select({ id: adminUsersTable.id, name: adminUsersTable.name })
    .from(adminUsersTable);

  const map = new Map<number | null, { adminId: number | null; adminName: string; total: number; lastAt: string | null }>();
  for (const r of rows) {
    map.set(r.adminId, {
      adminId: r.adminId,
      adminName: r.adminName,
      total: r.total,
      lastAt: r.lastAt ? new Date(r.lastAt as unknown as string).toISOString() : null,
    });
  }
  for (const s of staff) {
    if (!map.has(s.id)) {
      map.set(s.id, { adminId: s.id, adminName: s.name, total: 0, lastAt: null });
    }
  }
  res.json([...map.values()].sort((a, b) => b.total - a.total));
});

export default router;
