import { Router, type Request, type Response } from "express";
import axios from "axios";
import { supabase } from "../services/supabase.service.ts";
import { logger } from "../services/logger.service.ts";

const router = Router();

/**
 * GET /api/cv/:candidateId/preview
 * Proxy PDF file to display in iframe with proper headers
 */
router.get("/:candidateId/preview", async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;

    // Get candidate with cv_url
    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("id, full_name, cv_url")
      .eq("id", candidateId)
      .single();

    if (error || !candidate || !candidate.cv_url) {
      logger.warn({ candidateId }, "CV not found");
      return res.status(404).json({ error: "CV not found" });
    }

    // Fetch PDF from Supabase
    const pdfResponse = await axios.get(candidate.cv_url, {
      responseType: "arraybuffer",
    });

    // Send with headers to display in iframe instead of download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=cv.pdf",
      "Cache-Control": "public, max-age=86400",
    });

    res.send(pdfResponse.data);
  } catch (error: any) {
    logger.error({ error: error.message }, "CV preview error");
    res.status(500).json({ error: "Failed to load CV" });
  }
});

/**
 * GET /api/cv/:candidateId/download
 * Download PDF file (with attachment header)
 */
router.get("/:candidateId/download", async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;

    // Get candidate with cv_url
    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("id, full_name, cv_url")
      .eq("id", candidateId)
      .single();

    if (error || !candidate || !candidate.cv_url) {
      return res.status(404).json({ error: "CV not found" });
    }

    // Fetch PDF from Supabase
    const pdfResponse = await axios.get(candidate.cv_url, {
      responseType: "arraybuffer",
    });

    // Send with attachment header to force download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${candidate.full_name}_cv.pdf`,
    });

    res.send(pdfResponse.data);
  } catch (error: any) {
    logger.error({ error: error.message }, "CV download error");
    res.status(500).json({ error: "Failed to download CV" });
  }
});

export default router;
