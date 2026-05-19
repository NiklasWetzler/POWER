import express, { Router, type IRouter } from "express";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { db, customerMessagesTable, customersTable } from "@workspace/db";
import { requireCustomer, requireAdmin } from "../lib/authMiddleware";

const router: IRouter = Router();

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER endpoints (customer session required)
// ────────────────────────────────────────────────────────────────────────────

// GET /customer/messages — list messages for logged-in customer
router.get("/customer/messages", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const rows = await db
    .select({
      id: customerMessagesTable.id,
      subject: customerMessagesTable.subject,
      body: customerMessagesTable.body,
      pdfFilename: customerMessagesTable.pdfFilename,
      hasPdf: sql<boolean>`${customerMessagesTable.pdfBase64} IS NOT NULL`,
      icalAppointmentId: customerMessagesTable.icalAppointmentId,
      readAt: customerMessagesTable.readAt,
      createdAt: customerMessagesTable.createdAt,
    })
    .from(customerMessagesTable)
    .where(eq(customerMessagesTable.customerId, customerId))
    .orderBy(desc(customerMessagesTable.createdAt));

  res.json(rows.map((r) => ({
    ...r,
    readAt: r.readAt ? r.readAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  })));
});

// GET /customer/messages/unread-count — for nav badge
router.get("/customer/messages/unread-count", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customerMessagesTable)
    .where(and(eq(customerMessagesTable.customerId, customerId), isNull(customerMessagesTable.readAt)));
  res.json({ count: row?.count ?? 0 });
});

// POST /customer/messages/:id/read — mark as read
router.post("/customer/messages/:id/read", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const id = parseInt(String(req.params.id), 10);
  await db
    .update(customerMessagesTable)
    .set({ readAt: new Date() })
    .where(and(eq(customerMessagesTable.id, id), eq(customerMessagesTable.customerId, customerId)));
  res.json({ success: true });
});

// GET /customer/messages/:id/pdf — download PDF attachment
router.get("/customer/messages/:id/pdf", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const id = parseInt(String(req.params.id), 10);
  const [msg] = await db
    .select({
      pdfFilename: customerMessagesTable.pdfFilename,
      pdfBase64: customerMessagesTable.pdfBase64,
    })
    .from(customerMessagesTable)
    .where(and(eq(customerMessagesTable.id, id), eq(customerMessagesTable.customerId, customerId)));

  if (!msg || !msg.pdfBase64) {
    res.status(404).json({ error: "Anhang nicht gefunden." });
    return;
  }

  // Sanitize filename: strip CR/LF + quote chars to prevent header injection
  const safeName = (msg.pdfFilename ?? "anhang.pdf").replace(/[\r\n"\\]/g, "_").slice(0, 200);

  const buf = Buffer.from(msg.pdfBase64, "base64");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
  res.send(buf);
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN endpoints (admin session required)
// ────────────────────────────────────────────────────────────────────────────

// GET /admin/customers/:id/messages — list all messages for one customer
router.get("/admin/customers/:id/messages", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  const rows = await db
    .select({
      id: customerMessagesTable.id,
      subject: customerMessagesTable.subject,
      body: customerMessagesTable.body,
      pdfFilename: customerMessagesTable.pdfFilename,
      readAt: customerMessagesTable.readAt,
      createdAt: customerMessagesTable.createdAt,
    })
    .from(customerMessagesTable)
    .where(eq(customerMessagesTable.customerId, id))
    .orderBy(desc(customerMessagesTable.createdAt));

  res.json(rows.map((r) => ({
    ...r,
    readAt: r.readAt ? r.readAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  })));
});

// POST /admin/customers/:id/messages — send a new message (with optional PDF base64)
// Larger body limit only on this admin-only route (so PDFs up to ~12MB base64 fit)
const adminMessageBodyParser = express.json({ limit: "16mb" });
router.post("/admin/customers/:id/messages", requireAdmin, adminMessageBodyParser, async (req, res): Promise<void> => {
  const customerId = parseInt(String(req.params.id), 10);
  const { subject, body, pdfBase64, pdfFilename } = req.body as {
    subject?: string;
    body?: string;
    pdfBase64?: string;
    pdfFilename?: string;
  };

  if (!subject || !body) {
    res.status(400).json({ error: "Betreff und Nachricht sind erforderlich." });
    return;
  }

  // ensure customer exists
  const [customer] = await db.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.id, customerId));
  if (!customer) {
    res.status(404).json({ error: "Kunde nicht gefunden." });
    return;
  }

  // optional size guard (limit PDF to ~10 MB base64)
  if (pdfBase64 && pdfBase64.length > 15_000_000) {
    res.status(413).json({ error: "PDF zu groß (max. ca. 10 MB)." });
    return;
  }

  const [msg] = await db
    .insert(customerMessagesTable)
    .values({
      customerId,
      subject: subject.trim(),
      body: body.trim(),
      pdfBase64: pdfBase64 ?? null,
      pdfFilename: pdfBase64 ? (pdfFilename?.trim() || "anhang.pdf") : null,
    })
    .returning({
      id: customerMessagesTable.id,
      createdAt: customerMessagesTable.createdAt,
    });

  res.status(201).json({ id: msg!.id, createdAt: msg!.createdAt.toISOString() });
});

// DELETE /admin/customers/:cid/messages/:mid — remove a message
router.delete("/admin/customers/:cid/messages/:mid", requireAdmin, async (req, res): Promise<void> => {
  const mid = parseInt(String(req.params.mid), 10);
  await db.delete(customerMessagesTable).where(eq(customerMessagesTable.id, mid));
  res.json({ success: true });
});

export default router;
