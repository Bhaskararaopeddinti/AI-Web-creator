import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import hostelsRouter from "./hostels";
import departmentsRouter from "./departments";
import gatePassesRouter from "./gate-passes";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(hostelsRouter);
router.use(departmentsRouter);
router.use(gatePassesRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);
router.use(aiRouter);

export default router;
