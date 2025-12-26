import { Router } from "express";
import {
  triggerAiAnalysis,
  compareWithJobs,
} from "../controllers/ai.controller.ts";

const router = Router();

router.post("/ai/analyze", triggerAiAnalysis);
router.get("/ai/compare/:candidateId", compareWithJobs);

export default router;
