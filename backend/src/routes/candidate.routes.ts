import { Router } from "express";
import {
  intakeCandidate,
  enqueueAnalysisAfterUpload,
  getCandidates,
  getCandidateById,
  updateCandidateStatus,
} from "../controllers/candidate.controller.ts";
import { apiKeyAuth } from "../middleware/index.ts";

const router = Router();

// Step 1: Intake metadata, return signed upload URL
router.post("/candidates/intake", apiKeyAuth, intakeCandidate);

// Step 2: Confirm upload & enqueue analysis
router.post(
  "/candidates/:id/ingest",
  apiKeyAuth,
  enqueueAnalysisAfterUpload
);

// Alias route for n8n workflow compatibility
router.post(
  "/candidates/:id/enqueue",
  apiKeyAuth,
  enqueueAnalysisAfterUpload
);

// Get all candidates
router.get("/candidates", getCandidates);

// Get candidate by ID
router.get("/candidates/:id", getCandidateById);

// Update candidate status
router.patch("/candidates/:id/status", updateCandidateStatus);

export default router;
