import { Router, type IRouter } from "express";
import { eq, ilike, or, and, count, sql } from "drizzle-orm";
import { db, prospectsTable, activityTable } from "@workspace/db";
import {
  ListProspectsQueryParams,
  CreateProspectBody,
  GetProspectParams,
  GetProspectResponse,
  UpdateProspectParams,
  UpdateProspectBody,
  UpdateProspectResponse,
  DeleteProspectParams,
  ListProspectsResponse,
  GetProspectStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/prospects/stats", async (req, res): Promise<void> => {
  const rows = await db
    .select({ status: prospectsTable.status, cnt: count() })
    .from(prospectsTable)
    .groupBy(prospectsTable.status);

  const totalRes = await db.select({ cnt: count() }).from(prospectsTable);
  const total = Number(totalRes[0]?.cnt ?? 0);

  const byStatus: Record<string, number> = {
    new: 0,
    contacted: 0,
    replied: 0,
    qualified: 0,
    disqualified: 0,
  };
  for (const row of rows) {
    if (row.status in byStatus) byStatus[row.status] = Number(row.cnt);
  }

  res.json(GetProspectStatsResponse.parse({ total, byStatus }));
});

router.get("/prospects", async (req, res): Promise<void> => {
  const parsed = ListProspectsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, status, campaignId } = parsed.data;
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(prospectsTable.firstName, `%${search}%`),
        ilike(prospectsTable.lastName, `%${search}%`),
        ilike(prospectsTable.email, `%${search}%`),
        ilike(prospectsTable.company, `%${search}%`),
      ),
    );
  }

  if (status) {
    conditions.push(eq(prospectsTable.status, status));
  }

  if (campaignId != null) {
    conditions.push(eq(prospectsTable.campaignId, campaignId));
  }

  const prospects =
    conditions.length > 0
      ? await db
          .select()
          .from(prospectsTable)
          .where(and(...conditions))
          .orderBy(prospectsTable.createdAt)
      : await db.select().from(prospectsTable).orderBy(prospectsTable.createdAt);

  res.json(ListProspectsResponse.parse(prospects));
});

router.post("/prospects", async (req, res): Promise<void> => {
  const parsed = CreateProspectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prospect] = await db.insert(prospectsTable).values(parsed.data).returning();

  await db.insert(activityTable).values({
    type: "prospect_added",
    description: `New prospect added: ${prospect.firstName} ${prospect.lastName} at ${prospect.company}`,
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
  });

  res.status(201).json(GetProspectResponse.parse(prospect));
});

router.get("/prospects/:id", async (req, res): Promise<void> => {
  const params = GetProspectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prospect] = await db
    .select()
    .from(prospectsTable)
    .where(eq(prospectsTable.id, params.data.id));

  if (!prospect) {
    res.status(404).json({ error: "Prospect not found" });
    return;
  }

  res.json(GetProspectResponse.parse(prospect));
});

router.patch("/prospects/:id", async (req, res): Promise<void> => {
  const params = UpdateProspectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProspectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prospect] = await db
    .update(prospectsTable)
    .set(parsed.data)
    .where(eq(prospectsTable.id, params.data.id))
    .returning();

  if (!prospect) {
    res.status(404).json({ error: "Prospect not found" });
    return;
  }

  res.json(UpdateProspectResponse.parse(prospect));
});

router.delete("/prospects/:id", async (req, res): Promise<void> => {
  const params = DeleteProspectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prospect] = await db
    .delete(prospectsTable)
    .where(eq(prospectsTable.id, params.data.id))
    .returning();

  if (!prospect) {
    res.status(404).json({ error: "Prospect not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
