import axios from "axios";
import { config } from "../config.ts";
import { logger } from "../services/logger.service.ts";

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.gemini.apiKey}`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface JobContext {
  title?: string;
  requirements?: string;
  skills_required?: string[];
  experience_level?: string;
  location?: string;
  description?: string;
}

export interface CvAnalysis {
  score_overall: number;
  score_tech: number;
  score_experience: number;
  score_language: number;
  score_culture_fit?: number;
  strengths: string[];
  weaknesses: string[];
  matched_skills: string[];
  missing_skills: string[];
  notes_for_interviewer: string[];
  recommended_questions?: string[];
  summary: string;
  culture_assessment?: string;
}

export interface ScoringWeights {
  tech: number;
  experience: number;
  language: number;
  culture: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  tech: 0.4,
  experience: 0.3,
  language: 0.2,
  culture: 0.1,
};

const cleanJson = (text: string) => {
  const stripped = text.replace(/```json|```/gi, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  return match ? match[0] : stripped;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async (
  prompt: string,
  retries = MAX_RETRIES
): Promise<any> => {
  try {
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const response = await axios.post(GEMINI_API_URL, payload);
    const resultText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("No response from Gemini");
    return JSON.parse(cleanJson(resultText));
  } catch (error: any) {
    logger.error({ error: error.message, retries }, "Gemini API error");
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS * (MAX_RETRIES - retries + 1));
      return callGemini(prompt, retries - 1);
    }
    throw error;
  }
};

export const buildPrompt = (
  cvText: string,
  job: JobContext,
  weights?: ScoringWeights
): string => {
  const w = weights || DEFAULT_WEIGHTS;
  const jd = `Title: ${job.title || "Unknown"}
Location: ${job.location || "-"}
Experience level: ${job.experience_level || "-"}
Skills required: ${(job.skills_required || []).join(", ")}
Description: ${job.description || "-"}
Requirements: ${job.requirements || "-"}`;

  return `Bạn là chuyên gia tuyển dụng. Hãy đọc CV và so khớp với JD. Đánh giá đa tiêu chí với trọng số:
- Kỹ thuật (tech): ${w.tech * 100}%
- Kinh nghiệm (experience): ${w.experience * 100}%
- Ngoại ngữ (language): ${w.language * 100}%
- Văn hóa (culture fit): ${w.culture * 100}%

JD:
${jd}

CV:
${cvText}

Trả về duy nhất 1 JSON (không markdown, không giải thích):
{
  "score_overall": <0-100, tính theo trọng số>,
  "score_tech": <0-100>,
  "score_experience": <0-100>,
  "score_language": <0-100>,
  "score_culture_fit": <0-100>,
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "weaknesses": ["điểm yếu 1", "điểm yếu 2"],
  "matched_skills": ["skill khớp 1", "skill khớp 2"],
  "missing_skills": ["skill thiếu 1", "skill thiếu 2"],
  "notes_for_interviewer": ["gợi ý phỏng vấn 1", "gợi ý phỏng vấn 2"],
  "recommended_questions": ["câu hỏi phỏng vấn 1", "câu hỏi phỏng vấn 2"],
  "summary": "tóm tắt đánh giá tổng quan",
  "culture_assessment": "đánh giá văn hóa phù hợp"
}`;
};

export const analyzeCvTextWithGemini = async (
  cvText: string,
  job: JobContext,
  weights?: ScoringWeights
): Promise<CvAnalysis> => {
  const prompt = buildPrompt(cvText, job, weights);
  return callGemini(prompt);
};

export interface RuleEngineConfig {
  min_tech_score_pass: number;
  min_overall_score_pass: number;
  min_tech_score_borderline: number;
  min_overall_score_borderline: number;
  max_missing_skills_borderline: number;
}

const DEFAULT_RULES: RuleEngineConfig = {
  min_tech_score_pass: 65,
  min_overall_score_pass: 70,
  min_tech_score_borderline: 50,
  min_overall_score_borderline: 50,
  max_missing_skills_borderline: 3,
};

export const decideStatusFromScores = (
  analysis: CvAnalysis,
  rules?: RuleEngineConfig
): string => {
  const r = rules || DEFAULT_RULES;
  const { score_overall, score_tech, missing_skills } = analysis;

  if (
    score_overall >= r.min_overall_score_pass &&
    score_tech >= r.min_tech_score_pass
  ) {
    return "screening-passed";
  }

  if (
    score_overall >= r.min_overall_score_borderline ||
    score_tech >= r.min_tech_score_borderline ||
    (missing_skills && missing_skills.length <= r.max_missing_skills_borderline)
  ) {
    return "borderline";
  }

  return "rejected";
};

export const generateFeedbackMessage = (analysis: CvAnalysis): string => {
  const { score_overall, strengths, missing_skills, summary } = analysis;

  let feedback = `Cảm ơn bạn đã ứng tuyển!\n\n`;
  feedback += `Tổng điểm: ${score_overall}/100\n\n`;
  feedback += `Điểm mạnh:\n${strengths.map((s) => `- ${s}`).join("\n")}\n\n`;

  if (missing_skills && missing_skills.length > 0) {
    feedback += `Kỹ năng cần cải thiện:\n${missing_skills
      .map((s) => `- ${s}`)
      .join("\n")}\n\n`;
    feedback += `Gợi ý: Bạn có thể tham gia các khóa học về ${missing_skills
      .slice(0, 2)
      .join(", ")} để nâng cao cơ hội.\n\n`;
  }

  feedback += `Nhận xét: ${summary}`;
  return feedback;
};

// Backwards compatible helpers (kept for existing routes)
export const analyzeCvWithGemini = async (
  cvBuffer: Buffer,
  jobDescription: string
): Promise<any> => {
  const text = cvBuffer.toString("utf8");
  const prompt = `Analyze this CV text vs JD. JD: ${jobDescription}. CV: ${text}`;
  try {
    return callGemini(prompt);
  } catch (error) {
    logger.error(
      { error: (error as any)?.message },
      "Error analyzing CV with Gemini"
    );
    return null;
  }
};

export const compareWithMultipleJobs = async (
  cvBuffer: Buffer,
  jobs: Array<{ id: string; title: string; requirements: string }>
): Promise<any> => {
  const cvText = cvBuffer.toString("utf8");
  const jobsDescription = jobs
    .map((job, idx) => `Job ${idx + 1} (${job.title}):\n${job.requirements}`)
    .join("\n\n");
  const prompt = `So sánh CV với nhiều JD và trả JSON array sắp xếp theo điểm phù hợp giảm dần.\nCV:\n${cvText}\nJD list:\n${jobsDescription}`;
  try {
    return callGemini(prompt);
  } catch (error) {
    console.error("Error comparing with jobs:", (error as any)?.message);
    return null;
  }
};

export const reAnalyzeCandidate = async (
  candidateId: string,
  jobId?: string
): Promise<any> => {
  const { supabase } = await import("./supabase.service.js");
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    throw new Error("Candidate not found");
  }

  const cvResponse = await axios.get(candidate.cv_url, {
    responseType: "arraybuffer",
  });
  const cvBuffer = Buffer.from(cvResponse.data);

  let jobDescription = "General recruitment position";
  if (jobId) {
    const { data: job } = await supabase
      .from("jobs")
      .select(
        "description, requirements, title, skills_required, experience_level"
      )
      .eq("id", jobId)
      .single();

    if (job) {
      jobDescription = `${job.title}\n${job.description}\nRequirements:\n${job.requirements}`;
    }
  }

  const aiResult = await analyzeCvWithGemini(cvBuffer, jobDescription);

  if (aiResult) {
    await supabase
      .from("candidates")
      .update({
        ai_score: aiResult.suitability_score || aiResult.score_overall,
        ai_analysis: aiResult,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);
  }

  return aiResult;
};
