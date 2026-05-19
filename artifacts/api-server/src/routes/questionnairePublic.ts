import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { db, questionnaireSubmissionsTable } from "@workspace/db";
import { buildEmailHtml, buildEmailText } from "../lib/emailTemplate";
import { generateQuestionnairePdf } from "../lib/questionnairePdf";

const router: IRouter = Router();

export function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
    authMethod: "LOGIN",
    // Enforce certificate validation; only allow opt-out via env for debugging
    tls: { rejectUnauthorized: process.env.SMTP_INSECURE !== "1" },
  });
}

export function fromEmail() {
  return process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@niwe-events.com";
}

// POST /questionnaire/submit — public, couples fill this in
router.post("/questionnaire/submit", async (req, res): Promise<void> => {
  const { brautpaar, datum, location, formData } = req.body as {
    brautpaar?: string;
    datum?: string;
    location?: string;
    formData?: Record<string, unknown>;
  };

  if (!brautpaar || typeof brautpaar !== "string") {
    res.status(400).json({ error: "Name des Brautpaares ist erforderlich." });
    return;
  }

  const safeFormData = formData ?? {};

  const customerId = req.session.customerId ?? null;

  // Generate filled PDF (best-effort — failure does not block submission)
  let pdfBase64: string | null = null;
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateQuestionnairePdf({
      brautpaar,
      datum: datum ?? null,
      location: location ?? null,
      formData: safeFormData,
    });
    pdfBase64 = pdfBuffer.toString("base64");
  } catch (err) {
    req.log.error({ err }, "Failed to generate questionnaire PDF");
  }

  const [submission] = await db
    .insert(questionnaireSubmissionsTable)
    .values({
      customerId,
      formType: "musikfragebogen",
      brautpaar,
      datum: datum ?? null,
      location: location ?? null,
      formData: JSON.stringify(safeFormData),
      generatedPdfBase64: pdfBase64,
      status: "open",
      emailSent: "false",
      adminConfirmed: false,
    })
    .returning();

  if (!submission) {
    res.status(500).json({ error: "Fehler beim Speichern des Fragebogens." });
    return;
  }

  let emailSent = false;
  const transport = createTransport();

  if (transport) {
    try {
      const html = buildEmailHtml(brautpaar, datum, location, safeFormData);
      const text = buildEmailText(brautpaar, datum, location, safeFormData);
      const safeName = brautpaar.replace(/[^a-z0-9]/gi, "_");
      await transport.sendMail({
        from: `"NIWE Weddings Fragebogen" <${fromEmail()}>`,
        to: "info@niwe-events.com",
        subject: `Neuer Musikfragebogen – ${brautpaar}`,
        text, html,
        attachments: pdfBuffer
          ? [{
              filename: `Musikfragebogen-${safeName}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            }]
          : undefined,
      });
      emailSent = true;
      req.log.info({ submissionId: submission.id }, "Questionnaire email sent");
      await db.update(questionnaireSubmissionsTable)
        .set({ emailSent: "true" })
        .where(eq(questionnaireSubmissionsTable.id, submission.id));
    } catch (err) {
      req.log.error({ err, submissionId: submission.id }, "Failed to send questionnaire email");
    }
  }

  res.status(201).json({
    success: true,
    id: submission.id,
    emailSent,
    message: emailSent
      ? "Fragebogen gespeichert und E-Mail erfolgreich versendet."
      : "Fragebogen gespeichert.",
  });
});

export default router;
