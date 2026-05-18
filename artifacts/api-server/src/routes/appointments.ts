import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  db,
  appointmentsTable,
  customersTable,
  customerMessagesTable,
} from "@workspace/db";
import { requireCustomer, requireAdmin } from "../lib/authMiddleware";
import { buildIcs } from "../lib/ical";

const router: IRouter = Router();

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatDe(d: Date): string {
  return (
    d.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) +
    " um " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) +
    " Uhr"
  );
}

function parseDateTime(input: unknown): Date | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function createInboxConfirmation(
  customerId: number,
  appointmentId: number,
  finalAt: Date,
): Promise<void> {
  const subject = "Termin bestätigt";
  const dateStr = formatDe(finalAt);
  const body =
    `Euer Termin mit NIWE Weddings wurde bestätigt:\n\n` +
    `Termin: ${dateStr}\n\n` +
    `Ihr könnt den Termin mit dem Button unten direkt in euren Kalender übernehmen.\n\n` +
    `Eine Erinnerung erhaltet ihr 1 Tag und 1 Stunde vor dem Termin hier im Posteingang.\n\n` +
    `Wir freuen uns auf euch!\n— NIWE Weddings`;

  await db.insert(customerMessagesTable).values({
    customerId,
    subject,
    body,
    icalAppointmentId: appointmentId,
  });
}

function serializeAppointment(a: typeof appointmentsTable.$inferSelect) {
  return {
    id: a.id,
    customerId: a.customerId,
    status: a.status,
    customerProposedAt: a.customerProposedAt ? a.customerProposedAt.toISOString() : null,
    customerMessage: a.customerMessage,
    adminProposedAt: a.adminProposedAt ? a.adminProposedAt.toISOString() : null,
    adminMessage: a.adminMessage,
    finalAt: a.finalAt ? a.finalAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER endpoints
// ────────────────────────────────────────────────────────────────────────────

router.get("/customer/appointments", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const rows = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.customerId, customerId))
    .orderBy(desc(appointmentsTable.createdAt));
  res.json(rows.map(serializeAppointment));
});

router.post("/customer/appointments", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const { proposedAt, message } = req.body as { proposedAt?: string; message?: string };
  const dt = parseDateTime(proposedAt);
  if (!dt) {
    res.status(400).json({ error: "Bitte ein gültiges Datum und Uhrzeit angeben." });
    return;
  }
  if (dt.getTime() < Date.now() - 5 * 60_000) {
    res.status(400).json({ error: "Der Termin liegt in der Vergangenheit." });
    return;
  }

  const [row] = await db
    .insert(appointmentsTable)
    .values({
      customerId,
      status: "pending",
      customerProposedAt: dt,
      customerMessage: message?.trim() || null,
    })
    .returning();

  res.status(201).json(serializeAppointment(row!));
});

router.post("/customer/appointments/:id/accept", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const id = parseInt(String(req.params.id), 10);

  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.id, id), eq(appointmentsTable.customerId, customerId)));
  if (!appt) {
    res.status(404).json({ error: "Termin nicht gefunden." });
    return;
  }
  if (appt.status !== "proposed_by_admin" || !appt.adminProposedAt) {
    res.status(400).json({ error: "Es liegt kein Gegenvorschlag zur Annahme vor." });
    return;
  }

  const finalAt = appt.adminProposedAt;
  await db
    .update(appointmentsTable)
    .set({ status: "accepted", finalAt, updatedAt: new Date() })
    .where(eq(appointmentsTable.id, id));

  await createInboxConfirmation(customerId, id, finalAt);

  res.json({ success: true });
});

router.post("/customer/appointments/:id/decline", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const id = parseInt(String(req.params.id), 10);
  const { message } = req.body as { message?: string };

  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.id, id), eq(appointmentsTable.customerId, customerId)));
  if (!appt) {
    res.status(404).json({ error: "Termin nicht gefunden." });
    return;
  }
  if (appt.status !== "proposed_by_admin") {
    res.status(400).json({ error: "Dieser Termin kann nicht abgelehnt werden." });
    return;
  }

  await db
    .update(appointmentsTable)
    .set({
      status: "declined_by_customer",
      customerMessage: message?.trim() || appt.customerMessage,
      updatedAt: new Date(),
    })
    .where(eq(appointmentsTable.id, id));

  res.json({ success: true });
});

router.get("/customer/appointments/:id/ical", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const id = parseInt(String(req.params.id), 10);

  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.id, id), eq(appointmentsTable.customerId, customerId)));
  if (!appt || appt.status !== "accepted" || !appt.finalAt) {
    res.status(404).json({ error: "Bestätigter Termin nicht gefunden." });
    return;
  }

  const ics = buildIcs({
    uid: `appointment-${appt.id}@niweweddingsapp.de`,
    start: appt.finalAt,
    durationMinutes: 60,
    summary: "Beratungstermin – NIWE Weddings",
    description: "Beratungstermin mit NIWE Weddings.",
    organizerEmail: "info@niwe-events.com",
    organizerName: "NIWE Weddings",
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="niwe-termin-${appt.id}.ics"`);
  res.send(ics);
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN endpoints
// ────────────────────────────────────────────────────────────────────────────

router.get("/admin/appointments", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      appt: appointmentsTable,
      customerName: customersTable.name,
      customerEmail: customersTable.email,
    })
    .from(appointmentsTable)
    .innerJoin(customersTable, eq(customersTable.id, appointmentsTable.customerId))
    .orderBy(desc(appointmentsTable.createdAt));

  res.json(
    rows.map((r) => ({
      ...serializeAppointment(r.appt),
      customerName: r.customerName,
      customerEmail: r.customerEmail,
    })),
  );
});

router.get("/admin/appointments/pending-count", requireAdmin, async (_req, res): Promise<void> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(eq(appointmentsTable.status, "pending"));
  res.json({ count: row?.count ?? 0 });
});

// Admin accepts the customer's originally proposed time
router.post("/admin/appointments/:id/accept", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) {
    res.status(404).json({ error: "Termin nicht gefunden." });
    return;
  }
  if (appt.status !== "pending" || !appt.customerProposedAt) {
    res.status(400).json({ error: "Dieser Termin kann nicht direkt angenommen werden." });
    return;
  }

  const finalAt = appt.customerProposedAt;
  await db
    .update(appointmentsTable)
    .set({ status: "accepted", finalAt, updatedAt: new Date() })
    .where(eq(appointmentsTable.id, id));

  await createInboxConfirmation(appt.customerId, id, finalAt);
  res.json({ success: true });
});

// Admin proposes a different time
router.post("/admin/appointments/:id/propose", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const { proposedAt, message } = req.body as { proposedAt?: string; message?: string };
  const dt = parseDateTime(proposedAt);
  if (!dt) {
    res.status(400).json({ error: "Bitte ein gültiges Datum und Uhrzeit angeben." });
    return;
  }
  if (dt.getTime() < Date.now() - 5 * 60_000) {
    res.status(400).json({ error: "Der vorgeschlagene Termin liegt in der Vergangenheit." });
    return;
  }

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) {
    res.status(404).json({ error: "Termin nicht gefunden." });
    return;
  }
  if (appt.status !== "pending" && appt.status !== "proposed_by_admin") {
    res.status(400).json({ error: "In diesem Status kein Gegenvorschlag möglich." });
    return;
  }

  await db
    .update(appointmentsTable)
    .set({
      status: "proposed_by_admin",
      adminProposedAt: dt,
      adminMessage: message?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(appointmentsTable.id, id));

  res.json({ success: true });
});

router.post("/admin/appointments/:id/decline", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const { message } = req.body as { message?: string };
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) {
    res.status(404).json({ error: "Termin nicht gefunden." });
    return;
  }
  if (appt.status !== "pending" && appt.status !== "proposed_by_admin") {
    res.status(400).json({ error: "Dieser Termin kann nicht mehr abgelehnt werden." });
    return;
  }
  await db
    .update(appointmentsTable)
    .set({
      status: "declined_by_admin",
      adminMessage: message?.trim() || appt.adminMessage,
      updatedAt: new Date(),
    })
    .where(eq(appointmentsTable.id, id));
  res.json({ success: true });
});

export default router;
