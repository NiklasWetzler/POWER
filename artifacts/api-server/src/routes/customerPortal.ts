import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, questionnaireSubmissionsTable } from "@workspace/db";
import { requireCustomer } from "../lib/authMiddleware";

const router: IRouter = Router();

// Available forms catalogue (static for now, extend later)
router.get("/customer/forms", requireCustomer, (_req, res): void => {
  res.json([
    {
      id: "musikfragebogen",
      title: "Musikfragebogen",
      description: "Teilt uns eure Musikwünsche für eure Hochzeit mit — Genres, Songs, Ablauf und mehr.",
      icon: "music",
    },
  ]);
});

// Submitted forms for current customer
router.get("/customer/submissions", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;

  const rows = await db
    .select({
      id: questionnaireSubmissionsTable.id,
      brautpaar: questionnaireSubmissionsTable.brautpaar,
      datum: questionnaireSubmissionsTable.datum,
      location: questionnaireSubmissionsTable.location,
      status: questionnaireSubmissionsTable.status,
      adminConfirmed: questionnaireSubmissionsTable.adminConfirmed,
      createdAt: questionnaireSubmissionsTable.createdAt,
    })
    .from(questionnaireSubmissionsTable)
    .where(eq(questionnaireSubmissionsTable.customerId, customerId));

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export default router;
