import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  db,
  appointmentsTable,
  customersTable,
  chatMessagesTable,
  questionnaireSubmissionsTable,
} from "@workspace/db";

const router: IRouter = Router();

// GET /admin/briefing?since=<iso>
// Returns a daily briefing for the admin: today's accepted appointments,
// pending appointment requests, unread chat threads, and new questionnaire
// submissions since the provided timestamp (defaults to 24h ago).
router.get("/admin/briefing", async (req, res): Promise<void> => {
  const sinceParam = typeof req.query.since === "string" ? req.query.since : null;
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (Number.isNaN(since.getTime())) {
    res.status(400).json({ error: "Ungültiger since-Parameter." });
    return;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // 1. Today's confirmed appointments (accepted, with finalAt today)
  const todayApptRows = await db
    .select({
      id: appointmentsTable.id,
      finalAt: appointmentsTable.finalAt,
      note: appointmentsTable.customerMessage,
      customerName: customersTable.name,
    })
    .from(appointmentsTable)
    .innerJoin(customersTable, eq(customersTable.id, appointmentsTable.customerId))
    .where(
      and(
        eq(appointmentsTable.status, "accepted"),
        gte(appointmentsTable.finalAt, startOfToday),
        lt(appointmentsTable.finalAt, startOfTomorrow),
      ),
    )
    .orderBy(appointmentsTable.finalAt);

  // 2. Pending appointment requests (need admin action)
  const pendingApptRows = await db
    .select({
      id: appointmentsTable.id,
      customerProposedAt: appointmentsTable.customerProposedAt,
      note: appointmentsTable.customerMessage,
      customerName: customersTable.name,
    })
    .from(appointmentsTable)
    .innerJoin(customersTable, eq(customersTable.id, appointmentsTable.customerId))
    .where(eq(appointmentsTable.status, "pending"))
    .orderBy(desc(appointmentsTable.createdAt));

  // 3. Unread chat messages from customers (sender = 'customer', readByAdminAt IS NULL)
  const unreadChatRows = await db
    .select({
      customerId: chatMessagesTable.customerId,
      customerName: customersTable.name,
      count: sql<number>`count(*)::int`,
    })
    .from(chatMessagesTable)
    .innerJoin(customersTable, eq(customersTable.id, chatMessagesTable.customerId))
    .where(
      and(
        eq(chatMessagesTable.sender, "customer"),
        sql`${chatMessagesTable.readByAdminAt} IS NULL`,
      ),
    )
    .groupBy(chatMessagesTable.customerId, customersTable.name);

  const unreadChatTotal = unreadChatRows.reduce((sum, r) => sum + (r.count ?? 0), 0);

  // 4. New questionnaire submissions since `since`
  const newSubmissionRows = await db
    .select({
      id: questionnaireSubmissionsTable.id,
      brautpaar: questionnaireSubmissionsTable.brautpaar,
      formType: questionnaireSubmissionsTable.formType,
      createdAt: questionnaireSubmissionsTable.createdAt,
    })
    .from(questionnaireSubmissionsTable)
    .where(gte(questionnaireSubmissionsTable.createdAt, since))
    .orderBy(desc(questionnaireSubmissionsTable.createdAt));

  res.json({
    since: since.toISOString(),
    generatedAt: new Date().toISOString(),
    todaysAppointments: todayApptRows.map((r) => ({
      id: r.id,
      finalAt: r.finalAt ? r.finalAt.toISOString() : null,
      note: r.note,
      customerName: r.customerName,
    })),
    pendingAppointments: pendingApptRows.map((r) => ({
      id: r.id,
      customerProposedAt: r.customerProposedAt ? r.customerProposedAt.toISOString() : null,
      note: r.note,
      customerName: r.customerName,
    })),
    unreadChat: {
      total: unreadChatTotal,
      threads: unreadChatRows.map((r) => ({
        customerId: r.customerId,
        customerName: r.customerName,
        count: r.count,
      })),
    },
    newSubmissions: newSubmissionRows.map((r) => ({
      id: r.id,
      brautpaar: r.brautpaar,
      formType: r.formType,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

export default router;
