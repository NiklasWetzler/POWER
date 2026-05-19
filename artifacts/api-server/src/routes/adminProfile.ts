import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { requireAdmin } from "../lib/authMiddleware";
import { logActivity } from "../lib/adminActivity";

const router: IRouter = Router();

// Public: serve another admin's avatar (so customers can see who they're chatting with).
// Returns 404 if user has no avatar — never reveals other PII.
router.get("/admin-avatars/:id.jpg", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(404).end();
    return;
  }
  const [row] = await db
    .select({
      pic: adminUsersTable.profilePicBase64,
      mime: adminUsersTable.profilePicMime,
    })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, id))
    .limit(1);
  if (!row?.pic) {
    res.status(404).end();
    return;
  }
  const buf = Buffer.from(row.pic, "base64");
  res.setHeader("Content-Type", row.mime ?? "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.send(buf);
});

router.get("/admin/me", requireAdmin, async (req, res): Promise<void> => {
  const u = req.admin!;
  res.json({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    isSuperAdmin: u.isSuperAdmin,
    hasAvatar: Boolean(u.profilePicBase64),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  });
});

router.patch("/admin/me", requireAdmin, async (req, res): Promise<void> => {
  const me = req.admin!;
  const { name, email, profilePicBase64, profilePicMime, currentPassword, newPassword } = req.body as {
    name?: string;
    email?: string;
    profilePicBase64?: string | null;
    profilePicMime?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const update: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) update.name = name.trim().slice(0, 100);
  if (typeof email === "string" && email.trim()) update.email = email.trim().toLowerCase().slice(0, 200);

  if (profilePicBase64 === null) {
    update.profilePicBase64 = null;
    update.profilePicMime = null;
  } else if (typeof profilePicBase64 === "string" && profilePicBase64) {
    // Limit avatar size: max ~800 KB base64 (~600 KB image)
    if (profilePicBase64.length > 800_000) {
      res.status(413).json({ error: "Profilbild zu groß (max. ca. 600 KB)." });
      return;
    }
    const mime = (typeof profilePicMime === "string" ? profilePicMime : "image/jpeg").toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
      res.status(400).json({ error: "Nur JPG, PNG oder WebP erlaubt." });
      return;
    }
    update.profilePicBase64 = profilePicBase64;
    update.profilePicMime = mime;
  }

  if (typeof newPassword === "string" && newPassword) {
    if (newPassword.length < 10) {
      res.status(400).json({ error: "Neues Passwort muss mindestens 10 Zeichen haben." });
      return;
    }
    if (typeof currentPassword !== "string" || !currentPassword) {
      res.status(400).json({ error: "Aktuelles Passwort erforderlich." });
      return;
    }
    const ok = me.passwordHash
      ? await bcrypt.compare(currentPassword, me.passwordHash)
      : false;
    if (!ok) {
      res.status(401).json({ error: "Aktuelles Passwort falsch." });
      return;
    }
    update.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(update).length === 0) {
    res.json({ success: true, unchanged: true });
    return;
  }

  await db.update(adminUsersTable).set(update).where(eq(adminUsersTable.id, me.id));
  void logActivity(me, "profile.updated", {
    description: Object.keys(update).join(", "),
  });

  res.json({ success: true });
});

export default router;
