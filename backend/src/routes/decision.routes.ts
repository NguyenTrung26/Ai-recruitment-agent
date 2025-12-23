import { Router, type Request, type Response } from "express";
import { supabase } from "../services/supabase.service.js";
import { logger } from "../services/logger.service.js";
import { sendEmail } from "../services/notification.service.js";

const router = Router();

/**
 * POST /api/decision/approve
 * Approve candidate and send interview invitation email
 */
router.post("/approve", async (req: Request, res: Response) => {
  try {
    const { candidateId, interviewDate, interviewTime } = req.body;

    const numericCandidateId = Number(candidateId);
    if (!Number.isFinite(numericCandidateId)) {
      return res.status(400).json({
        error: "candidateId must be a valid number",
        details: { candidateId },
      });
    }

    if (!candidateId) {
      return res.status(400).json({ error: "candidateId is required" });
    }

    // Get candidate info
    const { data: candidate, error: fetchError } = await supabase
      .from("candidates")
      .select("id, full_name, email")
      .eq("id", numericCandidateId)
      .single();

    if (fetchError || !candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // If interview details are provided, create an entry in interview_schedules
    if (interviewDate) {
      const interviewISO = new Date(
        `${interviewDate}T${interviewTime || "10:00"}:00Z`
      ).toISOString();
      const { error: scheduleError } = await supabase
        .from("interview_schedules")
        .insert({
          candidate_id: numericCandidateId,
          job_id: null,
          interview_date: interviewISO,
          interview_type: "technical",
          status: "scheduled",
        });

      if (scheduleError) {
        logger.warn({ scheduleError }, "Failed to create interview schedule");
      }
    }

    // Update candidate status (align with defined enum values)
    const newStatus = interviewDate
      ? "interview-scheduled"
      : "screening-passed";
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", numericCandidateId);

    if (updateError) {
      logger.error({ updateError }, "Failed to update candidate status");
      return res.status(500).json({
        error: "Failed to update candidate",
        details: {
          message: updateError.message,
          details: (updateError as any)?.details,
          hint: (updateError as any)?.hint,
          code: updateError.code,
        },
      });
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Approve endpoint error");
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: errorMessage }, "Reject endpoint error");
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
});

export default router;
