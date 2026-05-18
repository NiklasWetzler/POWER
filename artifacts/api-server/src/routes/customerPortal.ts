import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  customersTable,
  questionnaireSubmissionsTable,
  formAssignmentsTable,
} from "@workspace/db";
import { requireCustomer } from "../lib/authMiddleware";
import { createTransport, fromEmail } from "./questionnairePublic";
import { generateContractPdf, type ContractData } from "../lib/contractPdf";

const router: IRouter = Router();

// Master catalogue of available forms
export const FORM_CATALOG: Record<string, { id: string; title: string; description: string; icon: string }> = {
  musikfragebogen: {
    id: "musikfragebogen",
    title: "Musikfragebogen",
    description: "Teilt uns eure Musikwünsche für eure Hochzeit mit — Genres, Songs, Ablauf und mehr.",
    icon: "music",
  },
  "dj-vertrag": {
    id: "dj-vertrag",
    title: "DJ-Booking Vertrag",
    description: "Aufführungsvertrag für die DJ-Leistung — bequem online ausfüllen und mit dem Finger unterschreiben.",
    icon: "file",
  },
};

export const VALID_FORM_IDS = new Set(Object.keys(FORM_CATALOG));

async function isFormAssigned(customerId: number, formId: string): Promise<boolean> {
  const rows = await db
    .select({ id: formAssignmentsTable.id })
    .from(formAssignmentsTable)
    .where(and(
      eq(formAssignmentsTable.customerId, customerId),
      eq(formAssignmentsTable.formId, formId),
    ));
  return rows.length > 0;
}

// GET /customer/forms — only forms assigned to this customer
router.get("/customer/forms", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const rows = await db
    .select({ formId: formAssignmentsTable.formId })
    .from(formAssignmentsTable)
    .where(eq(formAssignmentsTable.customerId, customerId));

  const forms = rows
    .map((r) => FORM_CATALOG[r.formId])
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  res.json(forms);
});

// GET /customer/me/info — full customer info (for form prefill)
router.get("/customer/me/info", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const [c] = await db.select().from(customersTable).where(eq(customersTable.id, customerId));
  if (!c) {
    res.status(404).json({ error: "Kunde nicht gefunden." });
    return;
  }
  res.json({ ...c, createdAt: c.createdAt.toISOString() });
});

// Submitted forms for current customer
router.get("/customer/submissions", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;

  const rows = await db
    .select({
      id: questionnaireSubmissionsTable.id,
      formType: questionnaireSubmissionsTable.formType,
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

// POST /customer/forms/dj-vertrag/submit — generate contract PDF + email + store
router.post("/customer/forms/dj-vertrag/submit", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const body = req.body as {
    auftraggeberName?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    telefon?: string;
    email?: string;
    veranstaltungsort?: string;
    datum?: string;
    spielzeit?: string;
    bemerkung?: string;
    djKuenstler?: string;
    gage?: string;
    verlaengerungProStunde?: string;
    anzahlungProzent?: string;
    anzahlungFrist?: string;
    sondervereinbarungen?: string;
    signatureDataUrl?: string;
  };

  if (!body.auftraggeberName || !body.signatureDataUrl) {
    res.status(400).json({ error: "Name und Unterschrift sind erforderlich." });
    return;
  }

  // Authorization: only customers whose admin has assigned the dj-vertrag form may submit
  if (!(await isFormAssigned(customerId, "dj-vertrag"))) {
    res.status(403).json({ error: "Dieses Formular ist für euren Account nicht freigegeben." });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, customerId));
  if (!customer) {
    res.status(404).json({ error: "Kunde nicht gefunden." });
    return;
  }

  // Build full contract data
  const datumFormatted = body.datum
    ? new Date(body.datum + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  const contract: ContractData = {
    auftraggeberName: body.auftraggeberName,
    auftraggeberAdresse: body.strasse || "—",
    auftraggeberPlzOrt: `${body.plz ?? ""} ${body.ort ?? ""}`.trim() || "—",
    auftraggeberTelefonEmail: [body.telefon, body.email].filter(Boolean).join(" / ") || "—",
    veranstaltungsort: body.veranstaltungsort || "—",
    datum: datumFormatted,
    djKuenstler: body.djKuenstler || "Nik Wetzler",
    spielzeit: body.spielzeit || "—",
    bemerkung: body.bemerkung || "—",
    gage: body.gage || "—",
    verlaengerungProStunde: body.verlaengerungProStunde || "100,00 €",
    anzahlungProzent: body.anzahlungProzent || "30 %",
    anzahlungFrist: body.anzahlungFrist || "14 Tagen",
    sondervereinbarungen: body.sondervereinbarungen || "",
    signatureDataUrl: body.signatureDataUrl,
    unterschriftDatum: new Date().toLocaleDateString("de-DE"),
  };

  const pdfBuffer = await generateContractPdf(contract);
  const pdfBase64 = pdfBuffer.toString("base64");

  const formData = { ...body, signatureDataUrl: undefined };

  const [submission] = await db
    .insert(questionnaireSubmissionsTable)
    .values({
      customerId,
      formType: "dj-vertrag",
      brautpaar: body.auftraggeberName,
      datum: body.datum ?? null,
      location: body.veranstaltungsort ?? null,
      formData: JSON.stringify(formData),
      signatureBase64: body.signatureDataUrl,
      generatedPdfBase64: pdfBase64,
      status: "open",
      emailSent: "false",
      adminConfirmed: false,
    })
    .returning();

  if (!submission) {
    res.status(500).json({ error: "Fehler beim Speichern." });
    return;
  }

  // Send email to admin
  let emailSent = false;
  const transport = createTransport();
  if (transport) {
    try {
      const html = `
        <h2>Neuer unterzeichneter DJ-Booking Vertrag</h2>
        <p><strong>Auftraggeber:</strong> ${body.auftraggeberName}</p>
        <p><strong>E-Mail:</strong> ${body.email ?? customer.email}</p>
        <p><strong>Telefon:</strong> ${body.telefon ?? "—"}</p>
        <p><strong>Veranstaltungsort:</strong> ${body.veranstaltungsort ?? "—"}</p>
        <p><strong>Datum:</strong> ${datumFormatted}</p>
        <p><strong>Gage:</strong> ${body.gage ?? "—"}</p>
        <p>Der vollständige Vertrag liegt als PDF im Anhang.</p>
        <hr>
        <p style="color:#888;font-size:12px">Übermittelt über das NIWE Weddings Portal.</p>
      `;
      await transport.sendMail({
        from: `"NIWE Weddings Portal" <${fromEmail()}>`,
        to: "info@niwe-events.com",
        subject: `Neuer DJ-Vertrag – ${body.auftraggeberName}`,
        html,
        attachments: [
          {
            filename: `DJ-Vertrag-${body.auftraggeberName.replace(/[^a-z0-9]/gi, "_")}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
      emailSent = true;
      await db
        .update(questionnaireSubmissionsTable)
        .set({ emailSent: "true" })
        .where(eq(questionnaireSubmissionsTable.id, submission.id));
    } catch (err) {
      req.log.error({ err, submissionId: submission.id }, "Failed to send DJ contract email");
    }
  }

  res.status(201).json({
    success: true,
    id: submission.id,
    emailSent,
    downloadUrl: `/api/customer/submissions/${submission.id}/pdf`,
  });
});

// GET /customer/submissions/:id/pdf — download generated PDF
router.get("/customer/submissions/:id/pdf", requireCustomer, async (req, res): Promise<void> => {
  const customerId = req.session.customerId!;
  const id = parseInt(String(req.params.id), 10);

  const [sub] = await db
    .select()
    .from(questionnaireSubmissionsTable)
    .where(and(
      eq(questionnaireSubmissionsTable.id, id),
      eq(questionnaireSubmissionsTable.customerId, customerId),
    ));

  if (!sub || !sub.generatedPdfBase64) {
    res.status(404).json({ error: "PDF nicht gefunden." });
    return;
  }

  const buf = Buffer.from(sub.generatedPdfBase64, "base64");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="DJ-Vertrag-${sub.brautpaar.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
  );
  res.send(buf);
});

export default router;
