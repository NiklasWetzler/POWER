import { Router, type IRouter } from "express";
import { timingSafeEqual } from "node:crypto";

const router: IRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const isProd = process.env.NODE_ENV === "production";

if (isProd && (!ADMIN_USERNAME || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12)) {
  // Fail-fast: do not allow the server to boot in prod with a weak/missing admin password
  throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD (>= 12 chars) must be set in production.");
}

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
    customerId: number;
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Still do a comparison with a dummy buffer to keep timing constant
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

router.post("/auth/login", (req, res): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    res.status(503).json({ error: "Admin-Login ist nicht konfiguriert." });
    return;
  }
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Benutzername und Passwort erforderlich." });
    return;
  }

  if (safeEqual(username, ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD)) {
    // Regenerate session ID on privilege change to prevent session fixation
    req.session.regenerate((regenErr) => {
      if (regenErr) {
        res.status(500).json({ error: "Session konnte nicht erstellt werden." });
        return;
      }
      req.session.isAdmin = true;
      req.session.save((err) => {
        if (err) {
          res.status(500).json({ error: "Session konnte nicht gespeichert werden." });
          return;
        }
        res.json({ success: true });
      });
    });
    return;
  }

  res.status(401).json({ error: "Benutzername oder Passwort falsch." });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("niwe.sid");
    res.json({ success: true });
  });
});

router.get("/auth/me", (req, res): void => {
  if (req.session.isAdmin) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

export default router;
