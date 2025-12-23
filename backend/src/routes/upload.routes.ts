import { Router } from "express";
import multer from "multer";
import { supabase } from "../services/supabase.service.js";
import { config } from "../config.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/candidates/upload", upload.single("cvFile"), async (req, res) => {
  try {
    const { candidateId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate storage path
    const storagePath = `${candidateId}_${Date.now()}.pdf`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(config.supabase.bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      storagePath,
      url: `${config.supabase.url}/storage/v1/object/public/${config.supabase.bucket}/${storagePath}`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
