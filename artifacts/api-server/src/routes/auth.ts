import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "NIWEWorker";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Charlie2025";

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
    customerId: number;
  }
}

router.post("/auth/login", (req, res): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Session konnte nicht gespeichert werden." });
        return;
      }
      res.json({ success: true });
    });
    return;
  }

  res.status(401).json({ error: "Benutzername oder Passwort falsch." });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
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
