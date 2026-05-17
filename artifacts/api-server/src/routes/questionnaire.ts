import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";
import { db, questionnaireSubmissionsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { buildEmailHtml, buildEmailText } from "../lib/emailTemplate";

const router: IRouter = Router();

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

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

  // Save submission to DB
  const [submission] = await db
    .insert(questionnaireSubmissionsTable)
    .values({
      brautpaar,
      datum: datum ?? null,
      location: location ?? null,
      formData: JSON.stringify(safeFormData),
      status: "open",
      emailSent: "false",
    })
    .returning();

  if (!submission) {
    res.status(500).json({ error: "Fehler beim Speichern des Fragebogens." });
    return;
  }

  // Try to send email
  let emailSent = false;
  const transport = createTransport();

  if (transport) {
    try {
      const html = buildEmailHtml(brautpaar, datum, location, safeFormData);
      const text = buildEmailText(brautpaar, datum, location);
      const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@niwe-events.com";

      await transport.sendMail({
        from: `"NIWE Weddings Fragebogen" <${fromEmail}>`,
        to: "info@niwe-events.com",
        subject: `Neuer Musikfragebogen – ${brautpaar}`,
        text,
        html,
      });

      emailSent = true;
      req.log.info({ submissionId: submission.id }, "Questionnaire email sent");

      // Update emailSent flag in DB
      await db
        .update(questionnaireSubmissionsTable)
        .set({ emailSent: "true" })
        .where(
          (await import("drizzle-orm")).eq(questionnaireSubmissionsTable.id, submission.id)
        );
    } catch (err) {
      req.log.error({ err, submissionId: submission.id }, "Failed to send questionnaire email");
    }
  } else {
    req.log.warn(
      { submissionId: submission.id },
      "SMTP not configured — questionnaire saved but email not sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable email delivery.",
    );
  }

  res.status(201).json({
    success: true,
    id: submission.id,
    emailSent,
    message: emailSent
      ? "Fragebogen gespeichert und E-Mail erfolgreich versendet."
      : "Fragebogen gespeichert. E-Mail-Versand wird nach SMTP-Konfiguration aktiv.",
  });
});

export default router;
