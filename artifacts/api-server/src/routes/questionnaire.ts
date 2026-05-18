import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { db, questionnaireSubmissionsTable } from "@workspace/db";
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
    authMethod: "LOGIN",
    tls: { rejectUnauthorized: false },
  });
}

function fromEmail() {
  return process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@niwe-events.com";
}

// POST /questionnaire/submit — save submission + email to info@niwe-events.com
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
      const text = buildEmailText(brautpaar, datum, location);

      await transport.sendMail({
        from: `"NIWE Weddings Fragebogen" <${fromEmail()}>`,
        to: "info@niwe-events.com",
        subject: `Neuer Musikfragebogen – ${brautpaar}`,
        text,
        html,
      });

      emailSent = true;
      req.log.info({ submissionId: submission.id }, "Questionnaire email sent");

      await db
        .update(questionnaireSubmissionsTable)
        .set({ emailSent: "true" })
        .where(eq(questionnaireSubmissionsTable.id, submission.id));
    } catch (err) {
      req.log.error({ err, submissionId: submission.id }, "Failed to send questionnaire email");
    }
  } else {
    req.log.warn({ submissionId: submission.id }, "SMTP not configured — email not sent.");
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

// GET /questionnaire/submissions — list all submissions (admin)
router.get("/questionnaire/submissions", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: questionnaireSubmissionsTable.id,
      brautpaar: questionnaireSubmissionsTable.brautpaar,
      datum: questionnaireSubmissionsTable.datum,
      location: questionnaireSubmissionsTable.location,
      status: questionnaireSubmissionsTable.status,
      emailSent: questionnaireSubmissionsTable.emailSent,
      createdAt: questionnaireSubmissionsTable.createdAt,
    })
    .from(questionnaireSubmissionsTable)
    .orderBy(questionnaireSubmissionsTable.createdAt);

  const result = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(result);
});

// PATCH /questionnaire/submissions/:id/status — update status (admin)
router.patch("/questionnaire/submissions/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body as { status?: string };

  if (!status || !["open", "in_progress", "done"].includes(status)) {
    res.status(400).json({ error: "Ungültiger Status." });
    return;
  }

  const [updated] = await db
    .update(questionnaireSubmissionsTable)
    .set({ status })
    .where(eq(questionnaireSubmissionsTable.id, id))
    .returning({ id: questionnaireSubmissionsTable.id });

  if (!updated) {
    res.status(404).json({ error: "Fragebogen nicht gefunden." });
    return;
  }

  res.json({ success: true, id: updated.id, status });
});

// POST /questionnaire/send-link — send questionnaire link to a couple (admin)
router.post("/questionnaire/send-link", async (req, res): Promise<void> => {
  const { brautpaarName, email } = req.body as { brautpaarName?: string; email?: string };

  if (!brautpaarName || !email) {
    res.status(400).json({ error: "Name und E-Mail-Adresse sind erforderlich." });
    return;
  }

  const transport = createTransport();

  if (!transport) {
    res.status(503).json({ error: "E-Mail-Versand nicht konfiguriert." });
    return;
  }

  // Build the public questionnaire URL from the request host
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = (req.headers["x-forwarded-host"] ?? req.headers.host ?? "").toString().split(",")[0]?.trim();
  const baseUrl = host ? `${proto}://${host}` : "";
  const link = `${baseUrl}/`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;font-size:14px;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1a1a;padding:28px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">NIWE Weddings</p>
            <p style="margin:4px 0 0;font-size:13px;color:#aaa;">Euer persönlicher Musikfragebogen</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;">Hallo ${brautpaarName},</p>
            <p style="margin:0 0 24px;line-height:1.6;color:#444;">
              damit wir eure Hochzeit musikalisch perfekt gestalten können, bitten wir euch, unseren 
              Online-Musikfragebogen auszufüllen. Das dauert nur wenige Minuten!
            </p>
            <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.3px;">
              Zum Musikfragebogen →
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.6;">
              Falls der Button nicht funktioniert, könnt ihr diesen Link kopieren:<br>
              <a href="${link}" style="color:#555;">${link}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#f9f9f9;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;">NIWE Weddings · NIWE Events · info@niwe-events.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: `"NIWE Weddings" <${fromEmail()}>`,
      to: email,
      subject: `Euer Musikfragebogen – ${brautpaarName}`,
      text: `Hallo ${brautpaarName},\n\nbitte füllt unseren Musikfragebogen aus:\n${link}\n\nViele Grüße\nNIWE Weddings`,
      html,
    });

    req.log.info({ email, brautpaarName }, "Questionnaire link sent to couple");
    res.json({ success: true, message: `Link erfolgreich an ${email} gesendet.` });
  } catch (err) {
    req.log.error({ err, email }, "Failed to send questionnaire link");
    res.status(500).json({ error: "E-Mail konnte nicht gesendet werden." });
  }
});

export default router;
