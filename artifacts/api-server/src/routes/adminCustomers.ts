import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";

const router: IRouter = Router();

// GET /admin/customers — list all customer accounts
router.get("/admin/customers", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      email: customersTable.email,
      angebotsnummer: customersTable.angebotsnummer,
      createdAt: customersTable.createdAt,
    })
    .from(customersTable)
    .orderBy(customersTable.createdAt);

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

// POST /admin/customers — create a new customer account
router.post("/admin/customers", async (req, res): Promise<void> => {
  const { name, email, angebotsnummer } = req.body as {
    name?: string;
    email?: string;
    angebotsnummer?: string;
  };

  if (!name || !email || !angebotsnummer) {
    res.status(400).json({ error: "Name, E-Mail und Angebotsnummer sind erforderlich." });
    return;
  }

  try {
    const [customer] = await db
      .insert(customersTable)
      .values({ name, email: email.toLowerCase().trim(), angebotsnummer: angebotsnummer.trim() })
      .returning();

    res.status(201).json({ ...customer, createdAt: customer!.createdAt.toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique")) {
      res.status(409).json({ error: "Ein Kundenkonto mit dieser E-Mail existiert bereits." });
    } else {
      res.status(500).json({ error: "Fehler beim Erstellen des Kundenkontos." });
    }
  }
});

// DELETE /admin/customers/:id — remove a customer account
router.delete("/admin/customers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(customersTable).where(eq(customersTable.id, id));
  res.json({ success: true });
});

export default router;
