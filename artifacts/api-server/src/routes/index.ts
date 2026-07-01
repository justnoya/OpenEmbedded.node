// @ts-nocheck
import { Router } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import exportRouter from "./export";
import webhookRouter from "./webhook";
import discordRouter from "./discord";
import botRouter from "./bot";
import botInteractionsRouter from "./bot-interactions";
import openbotRouter from "./openbot";
import schedulesRouter from "./schedules";
import uploadRouter from "./upload";
import adminRouter from "./admin";

const router = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(exportRouter);
router.use(webhookRouter);
router.use(discordRouter);
router.use(botRouter);
router.use(botInteractionsRouter);
router.use(openbotRouter);
router.use(schedulesRouter);
router.use(uploadRouter);
router.use(adminRouter);

export default router;
