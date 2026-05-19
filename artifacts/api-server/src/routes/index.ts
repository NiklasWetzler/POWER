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
import adminBriefingRouter from "./adminBriefing";
import customerMessagesRouter from "./customerMessages";
import chatRouter from "./chat";
import appointmentsRouter from "./appointments";
import adminProfileRouter from "./adminProfile";
import adminStaffRouter from "./adminStaff";
import adminActivityRouter from "./adminActivityRoute";
import adminInviteRouter from "./adminInvite";
import { requireAdmin } from "../lib/authMiddleware";

const router: IRouter = Router();

// ── Public (no auth required) ──────────────────────────────
router.use(authRouter);
router.use(customerAuthRouter);
router.use(healthRouter);
router.use(questionnairePublicRouter);
router.use(adminInviteRouter); // /admin-invite/:token (public set-password)

// ── Customer portal (customer session required) ────────────
router.use(customerPortalRouter);

// ── Mixed (per-route customer + admin auth via middleware) ─
router.use(customerMessagesRouter);
router.use(chatRouter);
router.use(appointmentsRouter);

// ── Admin self-guarded routers (own requireAdmin/SuperAdmin per route) ──
// Must be mounted BEFORE the global requireAdmin so the public avatar
// endpoint inside adminProfileRouter (/admin-avatars/:id.jpg) stays public.
router.use(adminProfileRouter);
router.use(adminStaffRouter);
router.use(adminActivityRouter);

// ── Admin (admin session required) ────────────────────────
router.use(requireAdmin);
router.use(prospectsRouter);
router.use(emailsRouter);
router.use(campaignsRouter);
router.use(dashboardRouter);
router.use(questionnaireAdminRouter);
router.use(adminCustomersRouter);
router.use(adminBriefingRouter);

export default router;
