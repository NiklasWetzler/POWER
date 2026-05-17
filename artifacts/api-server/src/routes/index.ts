import { Router, type IRouter } from "express";
import healthRouter from "./health";
import prospectsRouter from "./prospects";
import emailsRouter from "./emails";
import campaignsRouter from "./campaigns";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(prospectsRouter);
router.use(emailsRouter);
router.use(campaignsRouter);
router.use(dashboardRouter);

export default router;
