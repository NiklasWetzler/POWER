import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable, adminUsersTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/customer/login", async (req, res): Promise<void> => {
  const { email, angebotsnummer } = req.body as { email?: string; angebotsnummer?: string };

  if (!email || !angebotsnummer) {
    res.status(400).json({ error: "E-Mail und Angebotsnummer erforderlich." });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.email, email.toLowerCase().trim()));

  if (!customer || customer.angebotsnummer !== angebotsnummer.trim()) {
    res.status(401).json({ error: "E-Mail oder Angebotsnummer ungültig." });
    return;
  }

  // Regenerate session ID on login to prevent session fixation
  req.session.regenerate((regenErr) => {
    if (regenErr) {
      res.status(500).json({ error: "Session konnte nicht erstellt werden." });
      return;
    }
    req.session.customerId = customer.id;
    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Session konnte nicht gespeichert werden." });
        return;
      }
      res.json({
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          hochzeitsdatum: customer.hochzeitsdatum ?? null,
        },
      });
    });
  });
});

router.post("/customer/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("niwe.sid");
    res.json({ success: true });
  });
});

router.get("/customer/me", async (req, res): Promise<void> => {
  const customerId = req.session.customerId;
  if (!customerId) {
    res.json({ loggedIn: false });
    return;
  }
  // If this is a preview session, ensure the owning admin is still a super-admin.
  if (req.session.previewCustomerId) {
    const adminId = req.session.adminId;
    let stillAllowed = false;
    if (adminId) {
      const [admin] = await db
        .select({ isSuperAdmin: adminUsersTable.isSuperAdmin })
        .from(adminUsersTable)
        .where(eq(adminUsersTable.id, adminId));
      stillAllowed = admin?.isSuperAdmin === true;
    }
    if (!stillAllowed) {
      delete req.session.customerId;
      delete req.session.previewCustomerId;
      res.json({ loggedIn: false });
      return;
    }
  }

  const [customer] = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      email: customersTable.email,
      hochzeitsdatum: customersTable.hochzeitsdatum,
    })
    .from(customersTable)
    .where(eq(customersTable.id, customerId));

  if (!customer) {
    req.session.destroy(() => { /* ignore */ });
    res.json({ loggedIn: false });
    return;
  }

  const preview = req.session.previewCustomerId === customer.id
    ? { active: true as const, customerId: customer.id }
    : null;

  res.json({ loggedIn: true, customer, preview });
});

export default router;
