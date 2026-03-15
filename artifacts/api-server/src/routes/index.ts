import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cancerTypesRouter from "./cancer-types";
import preventionPathwaysRouter from "./prevention-pathways";
import riskAssessmentsRouter from "./risk-assessments";
import chatRouter from "./chat";
import healthLogsRouter from "./health-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cancerTypesRouter);
router.use(preventionPathwaysRouter);
router.use(riskAssessmentsRouter);
router.use(chatRouter);
router.use(healthLogsRouter);

export default router;
