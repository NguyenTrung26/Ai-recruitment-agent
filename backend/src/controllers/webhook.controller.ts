import type { Request, Response } from "express";
import { supabase } from "../services/supabase.service.ts";
import { logger } from "../services/logger.service.ts";

/**
 * Webhook endpoint for n8n to send data/events to backend
 * Example: Manual review decision, external triggers, etc.
 */
export const handleN8nWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    logger.info({ type, data }, "Received n8n webhook");

    switch (type) {
      case "manual_review_decision":
        await handleManualReviewDecision(data);
        break;
      
      case "interview_scheduled":
        await handleInterviewScheduled(data);
        break;
      
      case "offer_sent":
        await handleOfferSent(data);
        break;
      
      default:
        logger.warn({ type }, "Unknown webhook type");
        return res.status(400).json({ message: "Unknown webhook type" });
    }

    res.json({ message: "Webhook processed successfully" });
  } catch (error: any) {
    logger.error({ error: error.message }, "Webhook processing error");
    res.status(500).json({ message: error.message });
  }
};

/**
 * Handle manual review decision from HR (via n8n Slack/Teams approval)
 */
const handleManualReviewDecision = async (data: any) => {
  const { candidateId, decision, notes, reviewedBy } = data;
  
  const newStatus = decision === "approve" ? "screening-passed" : "rejected";
  
  await supabase
    .from("candidates")
    .update({
      status: newStatus,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);
  
  // Save to status history
  const { data: candidate } = await supabase
    .from("candidates")
    .select("status_history")
    .eq("id", candidateId)
    .single();
  
  const currentHistory = candidate?.status_history || [];
  await supabase
    .from("candidates")
    .update({
      status_history: [
        ...currentHistory,
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          reason: `Manual review: ${decision}`,
          reviewed_by: reviewedBy,
          notes,
        },
      ],
    })
    .eq("id", candidateId);
  
  await supabase.from("activity_logs").insert({
    candidate_id: candidateId,
    action: "manual_review_completed",
    description: `Manual review: ${decision} by ${reviewedBy}`,
    metadata: { decision, notes, reviewedBy },
  });
  
  logger.info({ candidateId, decision }, "Manual review decision processed");
};

/**
 * Handle interview scheduled event
 */
const handleInterviewScheduled = async (data: any) => {
  const { candidateId, interviewDate, interviewType, location, interviewers } = data;
  
  await supabase
    .from("candidates")
    .update({
      status: "interview-scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);
  
  await supabase.from("activity_logs").insert({
    candidate_id: candidateId,
    action: "interview_scheduled",
    description: `Interview scheduled for ${interviewDate}`,
    metadata: { interviewDate, interviewType, location, interviewers },
  });
  
  logger.info({ candidateId, interviewDate }, "Interview scheduled");
};

/**
 * Handle offer sent event
 */
const handleOfferSent = async (data: any) => {
  const { candidateId, offerDetails } = data;
  
  await supabase
    .from("candidates")
    .update({
      status: "offer-sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);
  
  await supabase.from("activity_logs").insert({
    candidate_id: candidateId,
    action: "offer_sent",
    description: "Job offer sent to candidate",
    metadata: offerDetails,
  });
  
  logger.info({ candidateId }, "Offer sent");
};
