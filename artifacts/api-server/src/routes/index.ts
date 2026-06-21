import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import exportRouter from "./export";
import webhookRouter from "./webhook";
import discordRouter from "./discord";
import botRouter from "./bot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(exportRouter);
router.use(webhookRouter);
router.use(discordRouter);
router.use(botRouter);

export default router;
