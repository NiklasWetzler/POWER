import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { logActivity } from "../lib/adminActivity";

const router: IRouter = Router();

router.get("/admin-invite/:token", async (req, res): Promise<void> => {
  const token = String(req.params.token);
  const [user] = await db
    .select({
      username: adminUsersTable.username,
      name: adminUsersTable.name,
      email: adminUsersTable.email,
    })
    .from(adminUsersTable)
    .where(
      and(
        eq(adminUsersTable.inviteToken, token),
        gt(adminUsersTable.inviteExpiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Einladung ungültig oder abgelaufen." });
    return;
  }
  res.json({ username: user.username, name: user.name, email: user.email });
});

router.post("/admin-invite/:token", async (req, res): Promise<void> => {
  const token = String(req.params.token);
  const { password } = req.body as { password?: string };
  if (!password || password.length < 10) {
    res.status(400).json({ error: "Passwort muss mindestens 10 Zeichen haben." });
    return;
  }
  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(
      and(
        eq(adminUsersTable.inviteToken, token),
        gt(adminUsersTable.inviteExpiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Einladung ungültig oder abgelaufen." });
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  await db
    .update(adminUsersTable)
    .set({
      passwordHash: hash,
      inviteToken: null,
      inviteExpiresAt: null,
    })
    .where(eq(adminUsersTable.id, user.id));

  void logActivity({ id: user.id, name: user.name }, "staff.password_set", {
    description: "Passwort über Einladungslink gesetzt.",
  });

  res.json({ success: true, username: user.username });
});

export default router;
