import { Router, type IRouter } from "express";
import { desc, eq, ilike, or } from "drizzle-orm";
import { db, customersTable, adminUsersTable } from "@workspace/db";
import { requireSuperAdmin } from "../lib/authMiddleware";
import { logActivity } from "../lib/adminActivity";

const router: IRouter = Router();

// Extend the session shape so we can mark an active "preview as customer"
// session that belongs to a super-admin.
declare module "express-session" {
  interface SessionData {
    previewCustomerId: number;
  }
}

// ── List customers a super-admin can step into ─────────────────────────────
router.get("/admin/preview/customers", requireSuperAdmin, async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const where = q
    ? or(
        ilike(customersTable.name, `%${q}%`),
        ilike(customersTable.email, `%${q}%`),
        ilike(customersTable.angebotsnummer, `%${q}%`),
      )
    : undefined;

  const rows = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      email: customersTable.email,
      angebotsnummer: customersTable.angebotsnummer,
      hochzeitsdatum: customersTable.hochzeitsdatum,
      createdAt: customersTable.createdAt,
    })
    .from(customersTable)
    .where(where)
    .orderBy(desc(customersTable.createdAt))
    .limit(200);

  res.json(rows);
});

// ── Enter preview mode as a specific customer ──────────────────────────────
// Sets BOTH session.customerId (so all existing customer routes Just Work)
// and session.previewCustomerId (a marker so the UI can show a banner and
// `/customer/me` can announce that this is a preview). The original
// session.adminId is preserved so the super-admin can leave preview again.
router.post("/admin/preview/start/:customerId", requireSuperAdmin, async (req, res): Promise<void> => {
  const customerId = Number(req.params.customerId);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    res.status(400).json({ error: "Ungültige Kunden-ID." });
    return;
  }

  const [customer] = await db
    .select({ id: customersTable.id, name: customersTable.name })
    .from(customersTable)
    .where(eq(customersTable.id, customerId));
  if (!customer) {
    res.status(404).json({ error: "Kunde nicht gefunden." });
    return;
  }

  req.session.customerId = customer.id;
  req.session.previewCustomerId = customer.id;

  void logActivity(req.admin!, "preview.started", {
    targetType: "customer",
    targetId: customer.id,
    targetLabel: customer.name,
    description: "Kundenansicht-Vorschau gestartet.",
  });

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session konnte nicht gespeichert werden." });
      return;
    }
    res.json({ success: true, customerId: customer.id, customerName: customer.name });
  });
});

// ── Leave preview mode and return to admin-only ────────────────────────────
// Intentionally NOT guarded by requireSuperAdmin: if the owning admin was
// downgraded mid-session they must still be able to exit preview. We only
// require that this session is currently in preview mode (has the marker).
router.post("/admin/preview/stop", (req, res): void => {
  const previewedId = req.session.previewCustomerId ?? null;
  if (!previewedId) {
    res.json({ success: true, alreadyStopped: true });
    return;
  }
  delete req.session.customerId;
  delete req.session.previewCustomerId;

  // Best-effort activity log if we still have a valid admin in session.
  if (req.session.adminId) {
    void (async () => {
      try {
        const [admin] = await db
          .select({ id: adminUsersTable.id, name: adminUsersTable.name })
          .from(adminUsersTable)
          .where(eq(adminUsersTable.id, req.session.adminId!));
        if (admin) {
          void logActivity(admin, "preview.stopped", {
            targetType: "customer",
            targetId: previewedId,
            description: "Kundenansicht-Vorschau beendet.",
          });
        }
      } catch { /* logging is best-effort */ }
    })();
  }

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session konnte nicht gespeichert werden." });
      return;
    }
    res.json({ success: true });
  });
});

export default router;
