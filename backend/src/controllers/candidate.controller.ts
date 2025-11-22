import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../services/supabase.service.js";
import { candidateApplicationSchema } from "../schemas/candidate.schema.js";
import { analyzeCvWithGemini } from "../services/gemini.service.js";
import { triggerN8nWorkflow } from "../services/n8n.service.js";
// Import các services khác sẽ được tạo sau
// import { analyzeCv } from '../services/gemini.service';
// import { triggerN8nWorkflow } from '../services/n8n.service';

interface MulterFile {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  path?: string;
}

type MulterRequest = Request & { file?: MulterFile };
export const handleApplication = async (req: MulterRequest, res: Response) => {
  try {
    // 1. Validate form data
    const applicationData = candidateApplicationSchema.parse(req.body);

    // 2. Validate file
    if (!req.file) {
      return res.status(400).json({ message: "CV file is required." });
    }
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "CV must be a PDF file." });
    }

    // 3. Upload CV to Supabase
    const cvFile = req.file;
    const fileName = `${applicationData.email}_${uuidv4()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(fileName, cvFile.buffer, { contentType: "application/pdf" });
    if (uploadError)
      throw new Error(`Supabase upload error: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage
      .from("cvs")
      .getPublicUrl(fileName);
    const cvUrl = publicUrlData.publicUrl;

    // 4. Save initial data to Supabase
    const { data: candidate, error: insertError } = await supabase
      .from("candidates")
      .insert({ ...applicationData, cv_url: cvUrl, status: "received" })
      .select()
      .single();
    if (insertError)
      throw new Error(`Database insert error: ${insertError.message}`);

    // 5. Trả về response ngay cho client
    res.status(201).json({
      message: "Application received and is being processed!",
      candidateId: candidate.id,
    });

    // --- 6. Chạy AI + webhook bất đồng bộ ---
    (async () => {
      try {
        const jobDescriptionExample =
          "We are looking for a Backend Developer with 3+ years experience in Node.js and PostgreSQL.";

        const aiResult = await analyzeCvWithGemini(
          cvFile.buffer,
          jobDescriptionExample
        );

        if (aiResult) {
          await supabase
            .from("candidates")
            .update({
              ai_score: aiResult.suitability_score,
              ai_analysis: aiResult,
              status: "processing",
            })
            .eq("id", candidate.id);
        }

        await triggerN8nWorkflow({
          candidate,
          ai_analysis: aiResult,
        });
      } catch (err) {
        console.error("Error processing AI / webhook:", err);
      }
    })();
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    }
    console.error("Application error:", error);
    res.status(500).json({
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};
