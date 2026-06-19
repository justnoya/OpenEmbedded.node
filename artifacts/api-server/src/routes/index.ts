import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import exportRouter from "./export";
import webhookRouter from "./webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(exportRouter);
router.use(webhookRouter);

export default router;
