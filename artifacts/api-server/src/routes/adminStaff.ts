import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { requireSuperAdmin } from "../lib/authMiddleware";
import { logActivity } from "../lib/adminActivity";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.use(requireSuperAdmin);

router.get("/admin/staff", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: adminUsersTable.id,
      username: adminUsersTable.username,
      name: adminUsersTable.name,
      email: adminUsersTable.email,
      isSuperAdmin: adminUsersTable.isSuperAdmin,
      hasAvatar: adminUsersTable.profilePicBase64,
      hasPassword: adminUsersTable.passwordHash,
      inviteExpiresAt: adminUsersTable.inviteExpiresAt,
      lastLoginAt: adminUsersTable.lastLoginAt,
      createdAt: adminUsersTable.createdAt,
    })
    .from(adminUsersTable)
    .orderBy(adminUsersTable.createdAt);

  res.json(
    rows.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.name,
      email: r.email,
      isSuperAdmin: r.isSuperAdmin,
      hasAvatar: Boolean(r.hasAvatar),
      status: r.hasPassword ? "active" : "invited",
      inviteExpiresAt: r.inviteExpiresAt ? r.inviteExpiresAt.toISOString() : null,
      lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/admin/staff", async (req, res): Promise<void> => {
  const { username, name, email, mode, password } = req.body as {
    username?: string;
    name?: string;
    email?: string;
    mode?: "password" | "invite";
    password?: string;
  };

  if (!username || !name || !email) {
    res.status(400).json({ error: "Benutzername, Name und E-Mail sind erforderlich." });
    return;
  }
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
    res.status(400).json({ error: "Benutzername: 3–30 Zeichen, nur a–z 0–9 . _ -" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: "Ungültige E-Mail-Adresse." });
    return;
  }

  let passwordHash: string | null = null;
  let inviteToken: string | null = null;
  let inviteExpiresAt: Date | null = null;

  if (mode === "password") {
    if (!password || password.length < 10) {
      res.status(400).json({ error: "Passwort muss mindestens 10 Zeichen haben." });
      return;
    }
    passwordHash = await bcrypt.hash(password, 12);
  } else {
    inviteToken = randomBytes(32).toString("hex");
    inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  let created;
  try {
    const [row] = await db
      .insert(adminUsersTable)
      .values({
        username: cleanUsername,
        name: name.trim().slice(0, 100),
        email: cleanEmail,
        passwordHash,
        inviteToken,
        inviteExpiresAt,
        isSuperAdmin: false,
      })
      .returning();
    created = row;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique")) {
      res.status(409).json({ error: "Benutzername oder E-Mail bereits vergeben." });
      return;
    }
    throw err;
  }

  let inviteUrl: string | null = null;
  if (mode === "invite" && inviteToken) {
    const origin = process.env.PUBLIC_APP_ORIGIN
      ?? (process.env.REPLIT_DOMAINS?.split(",")[0]?.trim()
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]!.trim()}`
        : "");
    inviteUrl = `${origin}/admin-einladung/${inviteToken}`;

    // Best-effort email — if SMTP isn't configured, we still return the URL so
    // the super-admin can share it manually.
    try {
      const { createTransport, fromEmail } = await import("./questionnairePublic");
      const transport = createTransport();
      if (!transport) {
        throw new Error("SMTP not configured");
      }
      await transport.sendMail({
        from: fromEmail(),
        to: cleanEmail,
        subject: "Einladung zum NIWE Admin-Bereich",
        text:
          `Hallo ${name.trim()},\n\n` +
          `du wurdest von ${req.admin!.name} in den NIWE Admin-Bereich eingeladen.\n\n` +
          `Bitte klicke auf folgenden Link, um dein Passwort zu setzen (gültig 7 Tage):\n` +
          `${inviteUrl}\n\n` +
          `Dein Benutzername: ${cleanUsername}\n\n` +
          `Viele Grüße\nNIWE Weddings`,
      });
    } catch (err) {
      logger.warn({ err }, "could not send invite email — returning URL to UI instead");
    }
  }

  void logActivity(req.admin!, mode === "invite" ? "staff.invited" : "staff.created", {
    targetType: "admin_user",
    targetId: created!.id,
    targetLabel: created!.name,
  });

  res.status(201).json({
    id: created!.id,
    username: created!.username,
    name: created!.name,
    email: created!.email,
    inviteUrl,
  });
});

router.delete("/admin/staff/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Ungültige ID." });
    return;
  }
  if (id === req.admin!.id) {
    res.status(400).json({ error: "Du kannst dich nicht selbst löschen." });
    return;
  }
  const [target] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
  if (!target) {
    res.status(404).json({ error: "Mitarbeiter nicht gefunden." });
    return;
  }
  if (target.isSuperAdmin) {
    res.status(403).json({ error: "Super-Admins können nicht gelöscht werden." });
    return;
  }
  await db.delete(adminUsersTable).where(eq(adminUsersTable.id, id));
  void logActivity(req.admin!, "staff.deleted", {
    targetType: "admin_user",
    targetId: id,
    targetLabel: target.name,
  });
  res.json({ success: true });
});

export default router;
