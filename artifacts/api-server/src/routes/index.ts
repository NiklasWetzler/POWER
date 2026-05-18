import { Router, type IRouter } from "express";
import healthRouter from "./health";
import prospectsRouter from "./prospects";
import emailsRouter from "./emails";
import campaignsRouter from "./campaigns";
import dashboardRouter from "./dashboard";
import questionnairePublicRouter from "./questionnairePublic";
import questionnaireAdminRouter from "./questionnaireAdmin";
import authRouter from "./auth";
import { requireAdmin } from "../lib/authMiddleware";

const router: IRouter = Router();

// ── Public (no auth required) ──────────────────────────────
router.use(authRouter);
router.use(healthRouter);
router.use(questionnairePublicRouter);

// ── Admin (session required) ───────────────────────────────
router.use(requireAdmin);
router.use(prospectsRouter);
router.use(emailsRouter);
router.use(campaignsRouter);
router.use(dashboardRouter);
router.use(questionnaireAdminRouter);

export default router;
