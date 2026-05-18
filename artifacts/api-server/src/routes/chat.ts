import { Router, type IRouter } from "express";
import { eq, and, asc, desc, isNull, sql } from "drizzle-orm";
import { db, chatMessagesTable, customersTable } from "@workspace/db";
import { requireCustomer, requireAdmin } from "../lib/authMiddleware";

const router: IRouter = Router();

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER chat endpoints
// ────────────────────────────────────────────────────────────────────────────

router.get("/customer/chat", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;

  const rows = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.customerId, customerId))
    .orderBy(asc(chatMessagesTable.createdAt));

  // mark all admin-sent messages as read by customer
  await db
    .update(chatMessagesTable)
    .set({ readByCustomerAt: new Date() })
    .where(
      and(
        eq(chatMessagesTable.customerId, customerId),
        eq(chatMessagesTable.sender, "admin"),
        isNull(chatMessagesTable.readByCustomerAt),
      ),
    );

  res.json(
    rows.map((r) => ({
      id: r.id,
      sender: r.sender,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.get("/customer/chat/unread-count", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.customerId, customerId),
        eq(chatMessagesTable.sender, "admin"),
        isNull(chatMessagesTable.readByCustomerAt),
      ),
    );
  res.json({ count: row?.count ?? 0 });
});

router.post("/customer/chat", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const { body } = req.body as { body?: string };
  if (!body || !body.trim()) {
    res.status(400).json({ error: "Nachricht darf nicht leer sein." });
    return;
  }
  if (body.length > 4000) {
    res.status(413).json({ error: "Nachricht zu lang (max. 4000 Zeichen)." });
    return;
  }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({
      customerId,
      sender: "customer",
      body: body.trim(),
      readByCustomerAt: new Date(),
    })
    .returning({ id: chatMessagesTable.id, createdAt: chatMessagesTable.createdAt });

  res.status(201).json({ id: msg!.id, createdAt: msg!.createdAt.toISOString() });
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN chat endpoints
// ────────────────────────────────────────────────────────────────────────────

// list all customer threads with last message + unread count
router.get("/admin/chat/threads", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      customerId: customersTable.id,
      customerName: customersTable.name,
      customerEmail: customersTable.email,
      lastMessageBody: sql<string | null>`(
        SELECT body FROM chat_messages cm
        WHERE cm.customer_id = ${customersTable.id}
        ORDER BY cm.created_at DESC LIMIT 1
      )`,
      lastMessageAt: sql<Date | null>`(
        SELECT created_at FROM chat_messages cm
        WHERE cm.customer_id = ${customersTable.id}
        ORDER BY cm.created_at DESC LIMIT 1
      )`,
      lastMessageSender: sql<string | null>`(
        SELECT sender FROM chat_messages cm
        WHERE cm.customer_id = ${customersTable.id}
        ORDER BY cm.created_at DESC LIMIT 1
      )`,
      unread: sql<number>`(
        SELECT COUNT(*)::int FROM chat_messages cm
        WHERE cm.customer_id = ${customersTable.id}
          AND cm.sender = 'customer'
          AND cm.read_by_admin_at IS NULL
      )`,
    })
    .from(customersTable);

  const filtered = rows
    .filter((r) => r.lastMessageAt !== null)
    .map((r) => ({
      ...r,
      lastMessageAt: r.lastMessageAt ? new Date(r.lastMessageAt as unknown as string).toISOString() : null,
    }))
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));

  res.json(filtered);
});

router.get("/admin/chat/unread-count", requireAdmin, async (_req, res): Promise<void> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.sender, "customer"),
        isNull(chatMessagesTable.readByAdminAt),
      ),
    );
  res.json({ count: row?.count ?? 0 });
});

router.get("/admin/chat/:customerId", requireAdmin, async (req, res): Promise<void> => {
  const customerId = parseInt(String(req.params.customerId), 10);

  const [customer] = await db
    .select({ id: customersTable.id, name: customersTable.name, email: customersTable.email })
    .from(customersTable)
    .where(eq(customersTable.id, customerId));
  if (!customer) {
    res.status(404).json({ error: "Kunde nicht gefunden." });
    return;
  }

  const rows = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.customerId, customerId))
    .orderBy(asc(chatMessagesTable.createdAt));

  // mark all customer-sent messages as read by admin
  await db
    .update(chatMessagesTable)
    .set({ readByAdminAt: new Date() })
    .where(
      and(
        eq(chatMessagesTable.customerId, customerId),
        eq(chatMessagesTable.sender, "customer"),
        isNull(chatMessagesTable.readByAdminAt),
      ),
    );

  res.json({
    customer,
    messages: rows.map((r) => ({
      id: r.id,
      sender: r.sender,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.post("/admin/chat/:customerId", requireAdmin, async (req, res): Promise<void> => {
  const customerId = parseInt(String(req.params.customerId), 10);
  const { body } = req.body as { body?: string };
  if (!body || !body.trim()) {
    res.status(400).json({ error: "Nachricht darf nicht leer sein." });
    return;
  }
  if (body.length > 4000) {
    res.status(413).json({ error: "Nachricht zu lang (max. 4000 Zeichen)." });
    return;
  }

  const [customer] = await db.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.id, customerId));
  if (!customer) {
    res.status(404).json({ error: "Kunde nicht gefunden." });
    return;
  }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({
      customerId,
      sender: "admin",
      body: body.trim(),
      readByAdminAt: new Date(),
    })
    .returning({ id: chatMessagesTable.id, createdAt: chatMessagesTable.createdAt });

  res.status(201).json({ id: msg!.id, createdAt: msg!.createdAt.toISOString() });
});

// suppress unused-import warning for desc (we may still need it elsewhere)
void desc;

export default router;
