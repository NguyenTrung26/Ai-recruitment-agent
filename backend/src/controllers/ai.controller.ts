import type { Request, Response } from "express";
import {
  reAnalyzeCandidate,
  compareWithMultipleJobs,
} from "../services/gemini.service.ts";
import { supabase } from "../services/supabase.service.ts";
import axios from "axios";

// Manual trigger AI analysis for a candidate
export const triggerAiAnalysis = async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ message: "candidateId is required" });
    }

    const aiResult = await reAnalyzeCandidate(candidateId, jobId);

    if (!aiResult) {
      return res.status(500).json({ message: "AI analysis failed" });
    }

    res.json({
      message: "AI analysis completed",
      analysis: aiResult,
    });
  } catch (error: any) {
    console.error("Trigger AI analysis error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Compare candidate with multiple jobs
export const compareWithJobs = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;

    // Get candidate
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Get all open jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, requirements")
      .eq("status", "open");

    if (jobsError || !jobs || jobs.length === 0) {
      return res.status(404).json({ message: "No open jobs found" });
    }

    // Get CV file
    const cvResponse = await axios.get(candidate.cv_url, {
      responseType: "arraybuffer",
    });
    const cvBuffer = Buffer.from(cvResponse.data);

    // Compare with all jobs
    const comparison = await compareWithMultipleJobs(cvBuffer, jobs);

    res.json({
      candidateId,
      candidateName: candidate.full_name,
      jobComparisons: comparison,
    });
  } catch (error: any) {
    console.error("Compare with jobs error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
