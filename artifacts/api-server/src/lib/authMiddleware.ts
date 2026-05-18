import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session.isAdmin) {
    next();
    return;
  }
  res.status(401).json({ error: "Nicht autorisiert. Bitte einloggen." });
}

export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  if (req.session.customerId) {
    next();
    return;
  }
  res.status(401).json({ error: "Nicht autorisiert. Bitte einloggen." });
}
