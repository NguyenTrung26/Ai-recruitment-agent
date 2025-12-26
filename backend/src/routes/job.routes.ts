import { Router } from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "../controllers/job.controller.ts";

const router = Router();

router.post("/jobs", createJob);
router.get("/jobs", getJobs);
router.get("/jobs/:id", getJobById);
router.patch("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);

export default router;
