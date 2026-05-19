import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, customersTable, formAssignmentsTable } from "@workspace/db";

const router: IRouter = Router();

const VALID_FORM_IDS = new Set(["musikfragebogen", "dj-vertrag"]);
const DEFAULT_ASSIGNED_FORMS = ["musikfragebogen"];

// GET /admin/customers — list all customer accounts
router.get("/admin/customers", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(customersTable)
    .orderBy(customersTable.createdAt);

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

// POST /admin/customers — create a new customer account
router.post("/admin/customers", async (req, res): Promise<void> => {
  const {
    name, email, angebotsnummer, hochzeitsdatum,
    telefon, strasse, plz, ort, location,
    djKuenstler, djGage,
  } = req.body as {
    name?: string;
    email?: string;
    angebotsnummer?: string;
    hochzeitsdatum?: string;
    telefon?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    location?: string;
    djKuenstler?: string;
    djGage?: string;
  };

  if (!name || !email || !angebotsnummer) {
    res.status(400).json({ error: "Name, E-Mail und Angebotsnummer sind erforderlich." });
    return;
  }

  try {
    const customer = await db.transaction(async (tx) => {
      const [c] = await tx
        .insert(customersTable)
        .values({
          name,
          email: email.toLowerCase().trim(),
          angebotsnummer: angebotsnummer.trim(),
          hochzeitsdatum: hochzeitsdatum?.trim() || null,
          telefon: telefon?.trim() || null,
          strasse: strasse?.trim() || null,
          plz: plz?.trim() || null,
          ort: ort?.trim() || null,
          location: location?.trim() || null,
          djKuenstler: djKuenstler?.trim() || null,
          djGage: djGage?.trim() || null,
        })
        .returning();
      if (c && DEFAULT_ASSIGNED_FORMS.length > 0) {
        await tx
          .insert(formAssignmentsTable)
          .values(DEFAULT_ASSIGNED_FORMS.map((formId) => ({ customerId: c.id, formId })));
      }
      return c;
    });

    res.status(201).json({ ...customer!, createdAt: customer!.createdAt.toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique")) {
      res.status(409).json({ error: "Ein Kundenkonto mit dieser E-Mail existiert bereits." });
    } else {
      res.status(500).json({ error: "Fehler beim Erstellen des Kundenkontos." });
    }
  }
});

// PATCH /admin/customers/:id — update a customer
router.patch("/admin/customers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const body = req.body as Record<string, string | undefined>;

  const updateFields: Record<string, string | null> = {};
  const allowed = [
    "name", "email", "angebotsnummer", "hochzeitsdatum",
    "telefon", "strasse", "plz", "ort", "location",
    "djKuenstler", "djSpielzeit", "djBemerkung", "djGage",
    "djVerlaengerung", "djAnzahlungProzent", "djAnzahlungFrist", "djSondervereinbarungen",
  ];
  for (const key of allowed) {
    if (key in body) {
      const v = body[key];
      if (key === "email") {
        updateFields[key] = (v ?? "").toLowerCase().trim();
      } else {
        updateFields[key] = v?.trim() || null;
      }
    }
  }
  // name + email + angebotsnummer cannot be null
  if ("name" in updateFields && !updateFields["name"]) delete updateFields["name"];
  if ("email" in updateFields && !updateFields["email"]) delete updateFields["email"];
  if ("angebotsnummer" in updateFields && !updateFields["angebotsnummer"]) delete updateFields["angebotsnummer"];

  try {
    const [updated] = await db
      .update(customersTable)
      .set(updateFields)
      .where(eq(customersTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Kunde nicht gefunden." });
      return;
    }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique")) {
      res.status(409).json({ error: "Diese E-Mail wird bereits verwendet." });
    } else {
      res.status(500).json({ error: "Fehler beim Aktualisieren." });
    }
  }
});

// DELETE /admin/customers/:id — remove a customer account and all related PII
router.delete("/admin/customers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Ungültige ID." });
    return;
  }

  // Lazy imports to avoid widening the top-level dependency surface
  const {
    questionnaireSubmissionsTable,
    customerMessagesTable,
    chatMessagesTable,
    appointmentsTable,
  } = await import("@workspace/db");

  await db.transaction(async (tx) => {
    await tx.delete(formAssignmentsTable).where(eq(formAssignmentsTable.customerId, id));
    await tx.delete(questionnaireSubmissionsTable).where(eq(questionnaireSubmissionsTable.customerId, id));
    await tx.delete(customerMessagesTable).where(eq(customerMessagesTable.customerId, id));
    await tx.delete(chatMessagesTable).where(eq(chatMessagesTable.customerId, id));
    await tx.delete(appointmentsTable).where(eq(appointmentsTable.customerId, id));
    await tx.delete(customersTable).where(eq(customersTable.id, id));
  });
  res.json({ success: true });
});

// GET /admin/customers/:id/forms — list assigned forms for this customer
router.get("/admin/customers/:id/forms", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const rows = await db
    .select({ formId: formAssignmentsTable.formId })
    .from(formAssignmentsTable)
    .where(eq(formAssignmentsTable.customerId, id));
  res.json(rows.map((r) => r.formId));
});

// PUT /admin/customers/:id/forms — set assigned forms for this customer
router.put("/admin/customers/:id/forms", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { formIds } = req.body as { formIds?: string[] };
  if (!Array.isArray(formIds) || !formIds.every((f) => typeof f === "string")) {
    res.status(400).json({ error: "formIds muss ein Array von Strings sein." });
    return;
  }

  // De-dupe and validate against allowlist
  const uniqueIds = Array.from(new Set(formIds));
  const invalid = uniqueIds.filter((f) => !VALID_FORM_IDS.has(f));
  if (invalid.length > 0) {
    res.status(400).json({ error: `Unbekannte Formulare: ${invalid.join(", ")}` });
    return;
  }

  // Transactional: delete-then-insert atomically so we never leave the customer with a partial state
  await db.transaction(async (tx) => {
    await tx.delete(formAssignmentsTable).where(eq(formAssignmentsTable.customerId, id));
    if (uniqueIds.length > 0) {
      await tx.insert(formAssignmentsTable).values(
        uniqueIds.map((fid) => ({ customerId: id, formId: fid })),
      );
    }
  });

  res.json({ success: true, formIds: uniqueIds });
});

// DELETE /admin/customers/:id/forms/:formId — remove single assignment
router.delete("/admin/customers/:id/forms/:formId", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const formId = req.params.formId;
  await db
    .delete(formAssignmentsTable)
    .where(and(eq(formAssignmentsTable.customerId, id), eq(formAssignmentsTable.formId, formId)));
  res.json({ success: true });
});

export default router;
