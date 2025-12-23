import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../services/supabase.service.ts";
import {
  candidateIntakeSchema,
  type CandidateIntakeInput,
} from "../schemas/candidate.schema.ts";
import { enqueueCandidateAnalysis } from "../queue/index.ts";
import { createSignedUploadUrl, ensurePathFromUrl } from "../services/storage.service.ts";

const sanitizeExtension = (fileName?: string) => {
  const ext = fileName?.split(".").pop() || "pdf";
  return ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "pdf";
};

const buildStoragePath = (email: string, input: CandidateIntakeInput) => {
  const ext = sanitizeExtension(input.file_name);
  const timestamp = Date.now();
  const randomKey = uuidv4().slice(0, 8);
  return `${email.replace(/[^a-z0-9]/gi, "_")}/${randomKey}-${timestamp}.${ext}`;
};

// Step 1: Intake metadata, return signed upload URL
export const intakeCandidate = async (req: Request, res: Response) => {
  try {
    const data = candidateIntakeSchema.parse(req.body);
    const storagePath = buildStoragePath(data.email, data);

    const upload = await createSignedUploadUrl(storagePath);

    const insertPayload: any = {
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone || null,
      cv_url: upload.publicUrl,
      status: "pending",
    };

    if (data.job_id) {
      insertPayload.job_id = parseInt(data.job_id, 10);
    }

    const { data: candidate, error } = await supabase
      .from("candidates")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new Error(`Database insert error: ${error.message}`);
    }

    return res.status(201).json({
      candidateId: candidate.id,
      uploadUrl: upload.signedUrl,
      storagePath: upload.path,
      publicUrl: upload.publicUrl,
      expiresInSeconds: upload.expiresIn,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    }
    console.error("Intake error:", error);
    return res.status(500).json({ message: error.message || "Internal error" });
  }
};

// Step 2: After upload success, enqueue AI analysis
export const enqueueAnalysisAfterUpload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { path } = req.body as { path?: string };

    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("id, job_id, cv_url")
      .eq("id", id)
      .single();

    if (error || !candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const storagePath = ensurePathFromUrl(path || candidate.cv_url);

    await enqueueCandidateAnalysis({
      candidateId: candidate.id,
      cvPath: storagePath,
      jobId: candidate.job_id || undefined,
    });

    await supabase
      .from("candidates")
      .update({ status: "processing" })
      .eq("id", id);

    return res.json({
      message: "Upload confirmed, analysis enqueued",
      candidateId: id,
    });
  } catch (error: any) {
    console.error("Enqueue analysis error:", error);
    return res.status(500).json({ message: error.message || "Internal error" });
  }
};

// Get all candidates with filters
export const getCandidates = async (req: Request, res: Response) => {
  try {
    const { status, job_id, limit = "50", offset = "0" } = req.query;

    let query = supabase
      .from("candidates")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (job_id) query = query.eq("job_id", job_id);

    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: candidates, error, count } = await query;

    if (error) throw new Error(`Database error: ${error.message}`);

    res.json({
      count: count || 0,
      candidates: candidates || [],
    });
  } catch (error: any) {
    console.error("Get candidates error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single candidate by ID
export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("*, jobs(*)")
      .eq("id", id)
      .single();

    if (error || !candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json({ candidate });
  } catch (error: any) {
    console.error("Get candidate error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update candidate status
export const updateCandidateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "screening-passed",
      "screening-failed",
      "interview-scheduled",
      "interviewed",
      "offer-sent",
      "hired",
      "rejected",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses,
      });
    }

    const { data: candidate, error } = await supabase
      .from("candidates")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json({
      message: "Status updated successfully",
      candidate,
    });
  } catch (error: any) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
