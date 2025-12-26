import axios from "axios";
import type { Job } from "bullmq";
import { supabase } from "../services/supabase.service.ts";
import {
  createSignedDownloadUrl,
  ensurePathFromUrl,
} from "../services/storage.service.ts";
import { parseAndExtractCv } from "../services/cv-parse.service.ts";
import {
  analyzeCvTextWithGemini,
  decideStatusFromScores,
  generateFeedbackMessage,
  type JobContext,
} from "../services/gemini.service.ts";
import {
  sendInterviewInvitation,
  sendRejectionFeedback,
  notifyRecruiter,
} from "../services/notification.service.ts";
import { logger } from "../services/logger.service.ts";
import { config } from "../config.ts";

export interface AnalyzeCandidatePayload {
  candidateId: string;
  cvPath: string;
  jobId?: string;
}

const fetchJobContext = async (jobId?: string): Promise<JobContext> => {
  if (!jobId) return {};
  const { data, error } = await supabase
    .from("jobs")
    .select("title, description, requirements, skills_required, experience_level, location")
    .eq("id", jobId)
    .single();
  if (error || !data) {
    logger.warn({ jobId }, "Job not found");
    return {};
  }
  return data as JobContext;
};

const saveStatusHistory = async (candidateId: string, status: string, reason: string) => {
  const historyEntry = {
    status,
    timestamp: new Date().toISOString(),
    reason,
  };
  
  const { data: candidate } = await supabase
    .from("candidates")
    .select("status_history")
    .eq("id", candidateId)
    .single();
  
  const currentHistory = candidate?.status_history || [];
  
  await supabase
    .from("candidates")
    .update({
      status_history: [...currentHistory, historyEntry],
    })
    .eq("id", candidateId);
};

export const analyzeCandidateJob = async (
  job: Job<AnalyzeCandidatePayload>
) => {
  const { candidateId, cvPath, jobId } = job.data;
  logger.info({ candidateId, jobId }, "Starting candidate analysis");
  job.log(`Starting analysis for candidate ${candidateId}`);

  try {
    // Step 1: Parse CV (PDF/DOCX) and extract entities
    const storagePath = ensurePathFromUrl(cvPath);
    logger.info({ candidateId, storagePath }, "Parsing CV");
    const parsedCv = await parseAndExtractCv(storagePath);
    
    job.updateProgress(25);

    // Step 2: Fetch job context
    const jobContext = await fetchJobContext(jobId);
    logger.info({ candidateId, jobTitle: jobContext.title }, "Job context fetched");
    
    job.updateProgress(30);

    // Step 3: Analyze CV with Gemini AI (with retry)
    logger.info({ candidateId }, "Calling Gemini AI");
    const analysis = await analyzeCvTextWithGemini(parsedCv.text, jobContext);
    
    job.updateProgress(70);

    // Step 4: Decide status based on rule engine
    const status = decideStatusFromScores(analysis);
    logger.info({
      candidateId,
      status,
      score: analysis.score_overall,
    }, "Analysis complete");
    
    job.updateProgress(80);

    // Step 5: Update database with results
    const updatePayload: Record<string, any> = {
      cv_text: parsedCv.text,
      cv_entities: parsedCv.entities,
      ai_score: analysis.score_overall,
      scores: {
        overall: analysis.score_overall,
        tech: analysis.score_tech,
        experience: analysis.score_experience,
        language: analysis.score_language,
        culture_fit: analysis.score_culture_fit,
      },
      ai_analysis: analysis,
      status,
      updated_at: new Date().toISOString(),
      notes: analysis.summary,
    };

    const { error: updateError } = await supabase
      .from("candidates")
      .update(updatePayload)
      .eq("id", candidateId);

    if (updateError) {
      throw new Error(`Failed to update candidate: ${updateError.message}`);
    }
    
    // Step 6: Save status history
    await saveStatusHistory(candidateId, status, `AI analysis: ${analysis.summary}`);

    // Step 7: Log activity
    await supabase.from("activity_logs").insert({
      candidate_id: candidateId,
      action: "ai_screening_completed",
      description: `AI status: ${status}, Score: ${analysis.score_overall}/100`,
      metadata: {
        scores: updatePayload.scores,
        status,
        matched_skills: analysis.matched_skills,
        missing_skills: analysis.missing_skills,
      },
    });
    
    job.updateProgress(90);

    // Step 8: Get candidate info for notifications
    const { data: candidate } = await supabase
      .from("candidates")
      .select("full_name, email")
      .eq("id", candidateId)
      .single();

    // Step 9: Send notifications based on status
    if (candidate) {
      const candidateName = candidate.full_name;
      const candidateEmail = candidate.email;
      const jobTitle = jobContext.title || "Unknown Position";

      // Notify recruiter
      await notifyRecruiter(
        candidateName,
        candidateId,
        jobTitle,
        analysis.score_overall,
        status
      );

      // Send email to candidate
      if (status === "screening-passed") {
        await sendInterviewInvitation(
          candidateName,
          candidateEmail,
          jobTitle,
          process.env.CALENDLY_LINK
        );
      } else if (status === "rejected") {
        const feedback = generateFeedbackMessage(analysis);
        await sendRejectionFeedback(
          candidateName,
          candidateEmail,
          jobTitle,
          feedback,
          analysis.missing_skills
        );
      }
      // "borderline" status goes to manual review, no auto-email
    }

    // Step 10: Send callback to n8n for workflow continuation
    if (config.n8n.callbackUrl) {
      try {
        await axios.post(config.n8n.callbackUrl, {
          candidateId,
          status,
          scores: updatePayload.scores,
          matched_skills: analysis.matched_skills,
          missing_skills: analysis.missing_skills,
          summary: analysis.summary,
          notes_for_interviewer: analysis.notes_for_interviewer,
          recommended_questions: analysis.recommended_questions,
        });
        logger.info({ candidateId }, "n8n callback sent");
      } catch (err: any) {
        logger.warn({
          candidateId,
          error: err?.message,
        }, "n8n callback failed");
        job.log(`Callback failed: ${err?.message}`);
      }
    }

    job.updateProgress(100);
    logger.info({ candidateId }, "Candidate analysis job completed");
    job.log(`Finished analysis for candidate ${candidateId}`);

    return {
      candidateId,
      status,
      score: analysis.score_overall,
    };
  } catch (error: any) {
    logger.error({
      candidateId,
      error: error.message,
      stack: error.stack,
    }, "Candidate analysis job failed");
    
    // Update candidate status to error
    await supabase
      .from("candidates")
      .update({
        status: "processing-failed",
        notes: `Analysis failed: ${error.message}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);
    
    throw error;
  }
};
