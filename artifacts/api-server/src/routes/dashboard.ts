import { Router, type IRouter } from "express";
import { eq, count, sql, desc } from "drizzle-orm";
import { db, prospectsTable, emailsTable, campaignsTable, activityTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetDashboardActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [totalProspectsRes] = await db.select({ cnt: count() }).from(prospectsTable);
  const totalProspects = Number(totalProspectsRes?.cnt ?? 0);

  const [totalCampaignsRes] = await db.select({ cnt: count() }).from(campaignsTable);
  const totalCampaigns = Number(totalCampaignsRes?.cnt ?? 0);

  const emailStatusRows = await db
    .select({ status: emailsTable.status, cnt: count() })
    .from(emailsTable)
    .groupBy(emailsTable.status);

  const emailsByStatus: Record<string, number> = { draft: 0, sent: 0, opened: 0, replied: 0 };
  for (const row of emailStatusRows) {
    if (row.status in emailsByStatus) emailsByStatus[row.status] = Number(row.cnt);
  }

  const totalEmailsSent = emailsByStatus.sent + emailsByStatus.opened + emailsByStatus.replied;
  const replyRate = totalEmailsSent > 0
    ? Math.round((emailsByStatus.replied / totalEmailsSent) * 100 * 10) / 10
    : 0;

  const prospectStatusRows = await db
    .select({ status: prospectsTable.status, cnt: count() })
    .from(prospectsTable)
    .groupBy(prospectsTable.status);

  const prospectsByStatus: Record<string, number> = { new: 0, contacted: 0, replied: 0, qualified: 0, disqualified: 0 };
  for (const row of prospectStatusRows) {
    if (row.status in prospectsByStatus) prospectsByStatus[row.status] = Number(row.cnt);
  }

  // Emails drafted today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [draftedTodayRes] = await db
    .select({ cnt: count() })
    .from(emailsTable)
    .where(sql`${emailsTable.createdAt} >= ${today}`);
  const emailsDraftedToday = Number(draftedTodayRes?.cnt ?? 0);

  // Top campaign by email count
  const topCampaignRows = await db
    .select({ name: campaignsTable.name, cnt: count(emailsTable.id) })
    .from(campaignsTable)
    .leftJoin(emailsTable, eq(emailsTable.campaignId, campaignsTable.id))
    .groupBy(campaignsTable.id, campaignsTable.name)
    .orderBy(desc(count(emailsTable.id)))
    .limit(1);

  const topCampaign = topCampaignRows[0]?.name ?? null;

  res.json(
    GetDashboardSummaryResponse.parse({
      totalProspects,
      totalEmailsSent,
      replyRate,
      totalCampaigns,
      emailsDraftedToday,
      topCampaign,
      prospectsByStatus,
      emailsByStatus,
    }),
  );
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(20);

  const serialized = items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  res.json(GetDashboardActivityResponse.parse(serialized));
});

export default router;
