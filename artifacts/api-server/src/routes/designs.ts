import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, designDraftsTable, customersTable } from "@workspace/db";
import { requireCustomer } from "../lib/authMiddleware";
import { getTemplate, KIND_LABEL, type CardKind } from "../lib/designTemplates";
import { generateDesignPdf } from "../lib/designPdf";
import { createTransport, fromEmail } from "./questionnairePublic";

const router: IRouter = Router();

const KIND_VALUES = new Set<CardKind>(["einladung", "tischkarte", "menuekarte", "dankeskarte"]);

interface DesignBody {
  kind?: string;
  templateId?: string;
  data?: Record<string, unknown>;
  photoBase64?: string | null;
}

interface ValidatedBody {
  kind?: CardKind;
  templateId?: string;
  data?: Record<string, unknown>;
  photoBase64?: string | null;
}

function validateDesignBody(body: unknown, requireRequired: boolean): { ok: true; value: ValidatedBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Ungültiger Body." };
  const b = body as DesignBody;
  const out: ValidatedBody = {};
  if (b.kind !== undefined) {
    if (typeof b.kind !== "string" || !KIND_VALUES.has(b.kind as CardKind)) {
      return { ok: false, error: "Ungültiger Kartentyp." };
    }
    out.kind = b.kind as CardKind;
  } else if (requireRequired) {
    return { ok: false, error: "Kartentyp fehlt." };
  }
  if (b.templateId !== undefined) {
    if (typeof b.templateId !== "string" || b.templateId.length === 0 || b.templateId.length > 80) {
      return { ok: false, error: "Ungültige Vorlage." };
    }
    out.templateId = b.templateId;
  } else if (requireRequired) {
    return { ok: false, error: "Vorlage fehlt." };
  }
  if (b.data !== undefined) {
    if (typeof b.data !== "object" || b.data === null || Array.isArray(b.data)) {
      return { ok: false, error: "Ungültige Daten." };
    }
    out.data = b.data;
  } else if (requireRequired) {
    out.data = {};
  }
  if (b.photoBase64 !== undefined) {
    if (b.photoBase64 !== null && (typeof b.photoBase64 !== "string" || b.photoBase64.length > 8_000_000)) {
      return { ok: false, error: "Foto zu groß oder ungültig (max. ~6 MB)." };
    }
    out.photoBase64 = b.photoBase64;
  }
  return { ok: true, value: out };
}

// ── List all designs of the current customer ──────────────────
router.get("/designs", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const rows = await db
    .select({
      id: designDraftsTable.id,
      kind: designDraftsTable.kind,
      templateId: designDraftsTable.templateId,
      data: designDraftsTable.data,
      hasPhoto: designDraftsTable.photoBase64,
      createdAt: designDraftsTable.createdAt,
      updatedAt: designDraftsTable.updatedAt,
    })
    .from(designDraftsTable)
    .where(eq(designDraftsTable.customerId, customerId))
    .orderBy(desc(designDraftsTable.updatedAt));
  res.json(rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    templateId: r.templateId,
    data: r.data,
    hasPhoto: Boolean(r.hasPhoto),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })));
});

// ── Create a new design (requires login) ──────────────────────
router.post("/designs", requireCustomer, async (req, res): Promise<void> => {
  const parsed = validateDesignBody(req.body, true);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { kind, templateId, data, photoBase64 } = parsed.value;
  if (!getTemplate(templateId!)) {
    res.status(400).json({ error: "Unbekannte Vorlage." });
    return;
  }
  const customerId = req.session.customerId!;
  const [row] = await db
    .insert(designDraftsTable)
    .values({
      customerId,
      kind: kind!,
      templateId: templateId!,
      data: data ?? {},
      photoBase64: photoBase64 ?? null,
    })
    .returning();
  req.log.info({ designId: row.id, kind, templateId }, "Design draft created");
  res.status(201).json({ id: row.id });
});

// ── Update an existing design ─────────────────────────────────
router.put("/designs/:id", requireCustomer, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Ungültige ID." });
    return;
  }
  const parsed = validateDesignBody(req.body, false);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const customerId = req.session.customerId!;
  const [existing] = await db
    .select()
    .from(designDraftsTable)
    .where(and(eq(designDraftsTable.id, id), eq(designDraftsTable.customerId, customerId)));
  if (!existing) {
    res.status(404).json({ error: "Karte nicht gefunden." });
    return;
  }
  const updates: Partial<typeof designDraftsTable.$inferInsert> = { updatedAt: new Date() };
  if (parsed.value.kind) updates.kind = parsed.value.kind;
  if (parsed.value.templateId) {
    if (!getTemplate(parsed.value.templateId)) {
      res.status(400).json({ error: "Unbekannte Vorlage." });
      return;
    }
    updates.templateId = parsed.value.templateId;
  }
  if (parsed.value.data) updates.data = parsed.value.data;
  if (parsed.value.photoBase64 !== undefined) updates.photoBase64 = parsed.value.photoBase64;
  await db.update(designDraftsTable).set(updates).where(eq(designDraftsTable.id, id));
  res.json({ success: true });
});

// ── Delete a design ──────────────────────────────────────────
router.delete("/designs/:id", requireCustomer, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Ungültige ID." });
    return;
  }
  const customerId = req.session.customerId!;
  const result = await db
    .delete(designDraftsTable)
    .where(and(eq(designDraftsTable.id, id), eq(designDraftsTable.customerId, customerId)));
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Karte nicht gefunden." });
    return;
  }
  res.json({ success: true });
});

// ── Render PDF (stream) ───────────────────────────────────────
router.get("/designs/:id/pdf", requireCustomer, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Ungültige ID." });
    return;
  }
  const customerId = req.session.customerId!;
  const [row] = await db
    .select()
    .from(designDraftsTable)
    .where(and(eq(designDraftsTable.id, id), eq(designDraftsTable.customerId, customerId)));
  if (!row) {
    res.status(404).json({ error: "Karte nicht gefunden." });
    return;
  }
  const template = getTemplate(row.templateId);
  if (!template) {
    res.status(500).json({ error: "Vorlage existiert nicht mehr." });
    return;
  }
  try {
    const pdf = await generateDesignPdf({
      kind: row.kind as CardKind,
      template,
      data: row.data ?? {},
      photoBase64: row.photoBase64,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="NIWE-${row.kind}-${row.id}.pdf"`,
    );
    res.send(pdf);
  } catch (err) {
    req.log.error({ err, designId: id }, "Failed to render design PDF");
    res.status(500).json({ error: "PDF konnte nicht erstellt werden." });
  }
});

// ── Email PDF to the customer's address ──────────────────────
router.post("/designs/:id/email", requireCustomer, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Ungültige ID." });
    return;
  }
  const customerId = req.session.customerId!;
  const [row] = await db
    .select()
    .from(designDraftsTable)
    .where(and(eq(designDraftsTable.id, id), eq(designDraftsTable.customerId, customerId)));
  if (!row) {
    res.status(404).json({ error: "Karte nicht gefunden." });
    return;
  }
  const template = getTemplate(row.templateId);
  if (!template) {
    res.status(500).json({ error: "Vorlage existiert nicht mehr." });
    return;
  }
  const [customer] = await db
    .select({ email: customersTable.email, name: customersTable.name })
    .from(customersTable)
    .where(eq(customersTable.id, customerId));
  if (!customer?.email) {
    res.status(400).json({ error: "Keine E-Mail-Adresse hinterlegt." });
    return;
  }

  const transport = createTransport();
  if (!transport) {
    res.status(503).json({ error: "E-Mail-Versand ist gerade nicht verfügbar." });
    return;
  }

  let pdf: Buffer;
  try {
    pdf = await generateDesignPdf({
      kind: row.kind as CardKind,
      template,
      data: row.data ?? {},
      photoBase64: row.photoBase64,
    });
  } catch (err) {
    req.log.error({ err, designId: id }, "Failed to render design PDF for email");
    res.status(500).json({ error: "PDF konnte nicht erstellt werden." });
    return;
  }

  const kindLabel = KIND_LABEL[row.kind as CardKind];
  const filename = `NIWE-${row.kind}-${row.id}.pdf`;

  try {
    await transport.sendMail({
      from: fromEmail(),
      to: customer.email,
      subject: `Eure ${kindLabel} von NIWE Weddings`,
      text:
        `Hallo${customer.name ? " " + customer.name : ""},\n\n` +
        `anbei findet ihr eure ${kindLabel} als PDF zum Anschauen oder Ausdrucken.\n\n` +
        `Ihr könnt das Design in eurem Kundenbereich jederzeit nochmal anpassen.\n\n` +
        `Herzliche Grüße\nEuer NIWE Weddings Team`,
      attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
    });
    req.log.info({ designId: id, to: customer.email }, "Design PDF emailed");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err, designId: id }, "Failed to email design PDF");
    res.status(500).json({ error: "E-Mail konnte nicht versendet werden." });
  }
});

export default router;
