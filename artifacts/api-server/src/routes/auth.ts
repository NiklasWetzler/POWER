import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { logActivity } from "../lib/adminActivity";

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
    adminId: number;
    customerId: number;
  }
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Benutzername und Passwort erforderlich." });
    return;
  }

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username.trim()))
    .limit(1);

  // Always do a bcrypt comparison to keep the timing constant whether or not
  // the user exists. Compare against a known dummy hash if the user is missing.
  const dummyHash = "$2b$12$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvwxyzabcdef";
  const hash = user?.passwordHash ?? dummyHash;
  const ok = await bcrypt.compare(password, hash);

  if (!user || !user.passwordHash || !ok) {
    if (user) {
      void logActivity({ id: user.id, name: user.name }, "auth.failed_login", {
        description: "Falsches Passwort.",
      });
    }
    res.status(401).json({ error: "Benutzername oder Passwort falsch." });
    return;
  }

  req.session.regenerate((regenErr) => {
    if (regenErr) {
      res.status(500).json({ error: "Session konnte nicht erstellt werden." });
      return;
    }
    req.session.isAdmin = true;
    req.session.adminId = user.id;
    req.session.save(async (err) => {
      if (err) {
        res.status(500).json({ error: "Session konnte nicht gespeichert werden." });
        return;
      }
      await db
        .update(adminUsersTable)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsersTable.id, user.id));
      void logActivity({ id: user.id, name: user.name }, "auth.login");
      res.json({ success: true });
    });
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("niwe.sid");
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.adminId) {
    res.json({ loggedIn: false });
    return;
  }
  const [user] = await db
    .select({
      id: adminUsersTable.id,
      username: adminUsersTable.username,
      name: adminUsersTable.name,
      email: adminUsersTable.email,
      isSuperAdmin: adminUsersTable.isSuperAdmin,
      hasAvatar: adminUsersTable.profilePicBase64,
    })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, req.session.adminId))
    .limit(1);
  if (!user) {
    res.json({ loggedIn: false });
    return;
  }
  res.json({
    loggedIn: true,
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    hasAvatar: Boolean(user.hasAvatar),
  });
});

export default router;
