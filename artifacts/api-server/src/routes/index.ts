import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import cancerTypesRouter from "./cancer-types";
import preventionPathwaysRouter from "./prevention-pathways";
import riskAssessmentsRouter from "./risk-assessments";
import chatRouter from "./chat";
import healthLogsRouter from "./health-logs";
import carePlansRouter from "./care-plans";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cancerTypesRouter);
router.use(preventionPathwaysRouter);
router.use(riskAssessmentsRouter);
router.use(chatRouter);
router.use(healthLogsRouter);
router.use(carePlansRouter);

export default router;
