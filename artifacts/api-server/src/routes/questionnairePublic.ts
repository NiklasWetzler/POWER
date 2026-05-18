import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { db, questionnaireSubmissionsTable } from "@workspace/db";
import { buildEmailHtml, buildEmailText } from "../lib/emailTemplate";

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
    tls: { rejectUnauthorized: false },
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

  let emailSent = false;
  const transport = createTransport();

  if (transport) {
    try {
      const html = buildEmailHtml(brautpaar, datum, location, safeFormData);
      const text = buildEmailText(brautpaar, datum, location, safeFormData);
      await transport.sendMail({
        from: `"NIWE Weddings Fragebogen" <${fromEmail()}>`,
        to: "info@niwe-events.com",
        subject: `Neuer Musikfragebogen – ${brautpaar}`,
        text, html,
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
