import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, campaignsTable, prospectsTable, emailsTable, activityTable } from "@workspace/db";
import {
  ListCampaignsResponse,
  CreateCampaignBody,
  GetCampaignParams,
  GetCampaignResponse,
  UpdateCampaignParams,
  UpdateCampaignBody,
  UpdateCampaignResponse,
  DeleteCampaignParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/campaigns", async (_req, res): Promise<void> => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);

  const enriched = await Promise.all(
    campaigns.map(async (c) => {
      const [prospectRes] = await db
        .select({ cnt: count() })
        .from(prospectsTable)
        .where(eq(prospectsTable.campaignId, c.id));

      const [emailRes] = await db
        .select({ cnt: count() })
        .from(emailsTable)
        .where(eq(emailsTable.campaignId, c.id));

      const [replyRes] = await db
        .select({ cnt: count() })
        .from(emailsTable)
        .where(eq(emailsTable.campaignId, c.id));

      const replies = await db
        .select({ cnt: count() })
        .from(emailsTable)
        .where(eq(emailsTable.status, "replied"));

      return {
        ...c,
        prospectCount: Number(prospectRes?.cnt ?? 0),
        emailCount: Number(emailRes?.cnt ?? 0),
        replyCount: Number(replies[0]?.cnt ?? 0),
      };
    }),
  );

  res.json(ListCampaignsResponse.parse(enriched));
});

router.post("/campaigns", async (req, res): Promise<void> => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [campaign] = await db.insert(campaignsTable).values(parsed.data).returning();

  await db.insert(activityTable).values({
    type: "campaign_created",
    description: `New campaign created: ${campaign.name}`,
    campaignName: campaign.name,
  });

  const result = { ...campaign, prospectCount: 0, emailCount: 0, replyCount: 0 };
  res.status(201).json(GetCampaignResponse.parse(result));
});

router.get("/campaigns/:id", async (req, res): Promise<void> => {
  const params = GetCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, params.data.id));

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const [prospectRes] = await db
    .select({ cnt: count() })
    .from(prospectsTable)
    .where(eq(prospectsTable.campaignId, campaign.id));

  const [emailRes] = await db
    .select({ cnt: count() })
    .from(emailsTable)
    .where(eq(emailsTable.campaignId, campaign.id));

  const replies = await db
    .select({ cnt: count() })
    .from(emailsTable)
    .where(eq(emailsTable.status, "replied"));

  const result = {
    ...campaign,
    prospectCount: Number(prospectRes?.cnt ?? 0),
    emailCount: Number(emailRes?.cnt ?? 0),
    replyCount: Number(replies[0]?.cnt ?? 0),
  };

  res.json(GetCampaignResponse.parse(result));
});

router.patch("/campaigns/:id", async (req, res): Promise<void> => {
  const params = UpdateCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [campaign] = await db
    .update(campaignsTable)
    .set(parsed.data)
    .where(eq(campaignsTable.id, params.data.id))
    .returning();

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const [prospectRes] = await db
    .select({ cnt: count() })
    .from(prospectsTable)
    .where(eq(prospectsTable.campaignId, campaign.id));

  const [emailRes] = await db
    .select({ cnt: count() })
    .from(emailsTable)
    .where(eq(emailsTable.campaignId, campaign.id));

  const replies = await db
    .select({ cnt: count() })
    .from(emailsTable)
    .where(eq(emailsTable.status, "replied"));

  const result = {
    ...campaign,
    prospectCount: Number(prospectRes?.cnt ?? 0),
    emailCount: Number(emailRes?.cnt ?? 0),
    replyCount: Number(replies[0]?.cnt ?? 0),
  };

  res.json(UpdateCampaignResponse.parse(result));
});

router.delete("/campaigns/:id", async (req, res): Promise<void> => {
  const params = DeleteCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [campaign] = await db
    .delete(campaignsTable)
    .where(eq(campaignsTable.id, params.data.id))
    .returning();

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
