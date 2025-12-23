import { Router, type Request, type Response } from "express";
import { supabase } from "../services/supabase.service.ts";
import { logger } from "../services/logger.service.ts";
import { sendEmail } from "../services/notification.service.ts";

const router = Router();

/**
 * POST /api/decision/approve
 * Approve candidate and send interview invitation email
 */
router.post("/approve", async (req: Request, res: Response) => {
  try {
    const { candidateId, interviewDate, interviewTime } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: "candidateId is required" });
    }

    // Get candidate info
    const { data: candidate, error: fetchError } = await supabase
      .from("candidates")
      .select("id, full_name, email")
      .eq("id", candidateId)
      .single();

    if (fetchError || !candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Update candidate status
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        status: "approved",
        interview_date: interviewDate || null,
        interview_time: interviewTime || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) {
      logger.error({ updateError }, "Failed to update candidate status");
      return res.status(500).json({ error: "Failed to update candidate" });
    }

    // Send approval email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Congratulations, ${
          candidate.full_name
        }!</h2>
        <p>We are excited to inform you that you have been approved for the next stage of our recruitment process.</p>
        
        ${
          interviewDate
            ? `
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">📅 Interview Details</h3>
            <p><strong>Date:</strong> ${interviewDate}</p>
            <p><strong>Time:</strong> ${interviewTime || "To be confirmed"}</p>
          </div>
        `
            : `
          <p>Our team will contact you soon to schedule your interview.</p>
        `
        }
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br/>AI Recruitment Team</p>
      </div>
    `;

    await sendEmail({
      to: candidate.email,
      subject: "Interview Invitation - AI Recruitment",
      html: emailHtml,
    });

    logger.info({ candidateId, email: candidate.email }, "Approval email sent");

    return res.json({
      message: "Candidate approved and email sent",
      candidate: {
        id: candidate.id,
        name: candidate.full_name,
        email: candidate.email,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Approve endpoint error");
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * POST /api/decision/reject
 * Reject candidate and send rejection email
 */
router.post("/reject", async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: "candidateId is required" });
    }

    // Get candidate info
    const { data: candidate, error: fetchError } = await supabase
      .from("candidates")
      .select("id, full_name, email")
      .eq("id", candidateId)
      .single();

    if (fetchError || !candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Update candidate status
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) {
      logger.error({ updateError }, "Failed to update candidate status");
      return res.status(500).json({ error: "Failed to update candidate" });
    }

    // Send rejection email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Thank You, ${candidate.full_name}</h2>
        <p>Thank you for your interest in our company and for taking the time to submit your application.</p>
        
        <p>After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
        
        <p>We encourage you to apply again in the future if you see a suitable position. We wish you the best of luck in your career journey.</p>
        
        <p>Best regards,<br/>AI Recruitment Team</p>
      </div>
    `;

    await sendEmail({
      to: candidate.email,
      subject: "Application Status - AI Recruitment",
      html: emailHtml,
    });

    logger.info(
      { candidateId, email: candidate.email },
      "Rejection email sent"
    );

    return res.json({
      message: "Candidate rejected and email sent",
      candidate: {
        id: candidate.id,
        name: candidate.full_name,
        email: candidate.email,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Reject endpoint error");
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default router;
