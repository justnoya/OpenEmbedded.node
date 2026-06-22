import { Router } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import exportRouter from "./export";
import webhookRouter from "./webhook";
import discordRouter from "./discord";
import botRouter from "./bot";
import openbotRouter from "./openbot";

const router = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(exportRouter);
router.use(webhookRouter);
router.use(discordRouter);
router.use(botRouter);
router.use(openbotRouter);

export default router;
