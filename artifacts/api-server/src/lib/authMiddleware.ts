import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, adminUsersTable, type AdminUser } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}

async function loadAdmin(req: Request): Promise<AdminUser | null> {
  const adminId = req.session.adminId;
  if (!adminId) return null;
  if (req.admin && req.admin.id === adminId) return req.admin;
  const [row] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, adminId))
    .limit(1);
  if (!row) return null;
  req.admin = row;
  return row;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const admin = await loadAdmin(req);
  if (!admin) {
    res.status(401).json({ error: "Nicht autorisiert. Bitte einloggen." });
    return;
  }
  next();
}

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const admin = await loadAdmin(req);
  if (!admin) {
    res.status(401).json({ error: "Nicht autorisiert. Bitte einloggen." });
    return;
  }
  if (!admin.isSuperAdmin) {
    res.status(403).json({ error: "Nur Super-Admins dürfen das." });
    return;
  }
  next();
}

export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  if (req.session.customerId) {
    next();
    return;
  }
  res.status(401).json({ error: "Nicht autorisiert. Bitte einloggen." });
}
