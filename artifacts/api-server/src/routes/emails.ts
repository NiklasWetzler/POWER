import { Router, type IRouter } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { db, emailsTable, prospectsTable, activityTable } from "@workspace/db";
import {
  ListEmailsQueryParams,
  GenerateEmailDraftBody,
  GetEmailParams,
  GetEmailResponse,
  UpdateEmailParams,
  UpdateEmailBody,
  UpdateEmailResponse,
  DeleteEmailParams,
  SendEmailParams,
  SendEmailResponse,
  ListEmailsResponse,
  GetEmailStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildEmailBody(prospectFirstName: string, company: string, tone: string, context?: string): { subject: string; body: string } {
  const toneMap: Record<string, { greeting: string; opening: string; cta: string }> = {
    professional: {
      greeting: `Dear ${prospectFirstName},`,
      opening: `I hope this message finds you well. I'm reaching out because I believe our solution could be a strong fit for ${company}.`,
      cta: "Would you be open to a brief 15-minute call this week to explore how we might be able to help?",
    },
    friendly: {
      greeting: `Hi ${prospectFirstName},`,
      opening: `I came across ${company} and was genuinely impressed by what you're building. I wanted to reach out directly.`,
      cta: "Would love to grab a quick 15-minute chat — any time this week work for you?",
    },
    concise: {
      greeting: `Hi ${prospectFirstName},`,
      opening: `Quick note: I think our platform could save ${company} significant time and resources.`,
      cta: "15 minutes this week?",
    },
    persuasive: {
      greeting: `Hi ${prospectFirstName},`,
      opening: `Companies like ${company} typically see 30-40% improvement in pipeline efficiency within 90 days of using our platform. I'd love to show you how.`,
      cta: "Can we find 15 minutes this week to walk through a quick demo?",
    },
  };

  const t = toneMap[tone] ?? toneMap.professional;
  const contextLine = context ? `\n\nI noticed ${context}. This makes me confident there's a strong alignment between what we offer and what ${company} needs right now.` : "";

  const body = `${t.greeting}

${t.opening}${contextLine}

Our platform helps SaaS teams streamline their sales outreach, automate personalization, and close deals faster — without the manual overhead.

${t.cta}

Best regards,
Your Name`;

  const subject = tone === "concise"
    ? `Quick question for ${company}`
    : tone === "friendly"
    ? `Loved what I saw at ${company}`
    : `Partnership opportunity — ${company}`;

  return { subject, body };
}

router.get("/emails/stats", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ status: emailsTable.status, cnt: count() })
    .from(emailsTable)
    .groupBy(emailsTable.status);

  const totalRes = await db.select({ cnt: count() }).from(emailsTable);
  const total = Number(totalRes[0]?.cnt ?? 0);

  const byStatus: Record<string, number> = { draft: 0, sent: 0, opened: 0, replied: 0 };
  for (const row of rows) {
    if (row.status in byStatus) byStatus[row.status] = Number(row.cnt);
  }

  const sentCount = byStatus.sent + byStatus.opened + byStatus.replied;
  const replyRate = sentCount > 0 ? Math.round((byStatus.replied / sentCount) * 100 * 10) / 10 : 0;

  res.json(GetEmailStatsResponse.parse({ total, byStatus, replyRate }));
});

router.get("/emails", async (req, res): Promise<void> => {
  const parsed = ListEmailsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prospectId, campaignId, status } = parsed.data;
  const conditions = [];

  if (prospectId != null) conditions.push(eq(emailsTable.prospectId, prospectId));
  if (campaignId != null) conditions.push(eq(emailsTable.campaignId, campaignId));
  if (status) conditions.push(eq(emailsTable.status, status));

  const rows = conditions.length > 0
    ? await db
        .select({ email: emailsTable, prospect: prospectsTable })
        .from(emailsTable)
        .leftJoin(prospectsTable, eq(emailsTable.prospectId, prospectsTable.id))
        .where(and(...conditions))
        .orderBy(emailsTable.createdAt)
    : await db
        .select({ email: emailsTable, prospect: prospectsTable })
        .from(emailsTable)
        .leftJoin(prospectsTable, eq(emailsTable.prospectId, prospectsTable.id))
        .orderBy(emailsTable.createdAt);

  const emails = rows.map((r) => ({ ...r.email, prospect: r.prospect }));
  res.json(ListEmailsResponse.parse(emails));
});

router.post("/emails/generate", async (req, res): Promise<void> => {
  const parsed = GenerateEmailDraftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prospectId, campaignId, tone = "professional", context } = parsed.data;

  const [prospect] = await db
    .select()
    .from(prospectsTable)
    .where(eq(prospectsTable.id, prospectId));

  if (!prospect) {
    res.status(404).json({ error: "Prospect not found" });
    return;
  }

  const { subject, body } = buildEmailBody(prospect.firstName, prospect.company, tone, context ?? undefined);

  const [email] = await db
    .insert(emailsTable)
    .values({ prospectId, campaignId: campaignId ?? null, subject, body, status: "draft" })
    .returning();

  await db.insert(activityTable).values({
    type: "email_drafted",
    description: `Email drafted for ${prospect.firstName} ${prospect.lastName} at ${prospect.company}`,
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
  });

  const result = { ...email, prospect };
  res.status(201).json(GetEmailResponse.parse(result));
});

router.get("/emails/:id", async (req, res): Promise<void> => {
  const params = GetEmailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ email: emailsTable, prospect: prospectsTable })
    .from(emailsTable)
    .leftJoin(prospectsTable, eq(emailsTable.prospectId, prospectsTable.id))
    .where(eq(emailsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  res.json(GetEmailResponse.parse({ ...row.email, prospect: row.prospect }));
});

router.patch("/emails/:id", async (req, res): Promise<void> => {
  const params = UpdateEmailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [email] = await db
    .update(emailsTable)
    .set(parsed.data)
    .where(eq(emailsTable.id, params.data.id))
    .returning();

  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  const [prospect] = await db
    .select()
    .from(prospectsTable)
    .where(eq(prospectsTable.id, email.prospectId));

  res.json(UpdateEmailResponse.parse({ ...email, prospect }));
});

router.delete("/emails/:id", async (req, res): Promise<void> => {
  const params = DeleteEmailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [email] = await db
    .delete(emailsTable)
    .where(eq(emailsTable.id, params.data.id))
    .returning();

  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/emails/:id/send", async (req, res): Promise<void> => {
  const params = SendEmailParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [email] = await db
    .update(emailsTable)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(emailsTable.id, params.data.id))
    .returning();

  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  const [prospect] = await db
    .select()
    .from(prospectsTable)
    .where(eq(prospectsTable.id, email.prospectId));

  // Update prospect status to contacted
  if (prospect && prospect.status === "new") {
    await db
      .update(prospectsTable)
      .set({ status: "contacted" })
      .where(eq(prospectsTable.id, prospect.id));
  }

  await db.insert(activityTable).values({
    type: "email_sent",
    description: `Email sent to ${prospect?.firstName ?? ""} ${prospect?.lastName ?? ""} at ${prospect?.company ?? ""}`,
    prospectName: prospect ? `${prospect.firstName} ${prospect.lastName}` : null,
  });

  res.json(SendEmailResponse.parse({ ...email, prospect }));
});

export default router;
