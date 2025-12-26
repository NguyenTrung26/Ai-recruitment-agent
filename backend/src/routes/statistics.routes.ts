import { Router } from "express";
import {
  getStatistics,
  getCandidatesByJob,
} from "../controllers/statistics.controller.ts";

const router = Router();

router.get("/statistics", getStatistics);
router.get("/statistics/job/:jobId", getCandidatesByJob);

export default router;
