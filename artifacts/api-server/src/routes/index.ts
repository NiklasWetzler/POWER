import { Router, type IRouter } from "express";
import healthRouter from "./health";
import prospectsRouter from "./prospects";
import emailsRouter from "./emails";
import campaignsRouter from "./campaigns";
import dashboardRouter from "./dashboard";
import questionnairePublicRouter from "./questionnairePublic";
import questionnaireAdminRouter from "./questionnaireAdmin";
import authRouter from "./auth";
import customerAuthRouter from "./customerAuth";
import customerPortalRouter from "./customerPortal";
import adminCustomersRouter from "./adminCustomers";
import customerMessagesRouter from "./customerMessages";
import { requireAdmin } from "../lib/authMiddleware";

const router: IRouter = Router();

// ── Public (no auth required) ──────────────────────────────
router.use(authRouter);
router.use(customerAuthRouter);
router.use(healthRouter);
router.use(questionnairePublicRouter);

// ── Customer portal (customer session required) ────────────
router.use(customerPortalRouter);

// ── Mixed (per-route customer + admin auth via middleware) ─
router.use(customerMessagesRouter);

// ── Admin (admin session required) ────────────────────────
router.use(requireAdmin);
router.use(prospectsRouter);
router.use(emailsRouter);
router.use(campaignsRouter);
router.use(dashboardRouter);
router.use(questionnaireAdminRouter);
router.use(adminCustomersRouter);

export default router;
