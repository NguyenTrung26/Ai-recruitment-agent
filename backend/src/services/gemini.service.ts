import axios from "axios";
import * as pdfParse from "pdf-parse";
// ✔ sử dụng default import
import { config } from "../config.js";

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.gemini.apiKey}`;

const extractTextFromPdf = async (pdfBuffer: Buffer): Promise<string> => {
  const data = await (pdfParse as any)(pdfBuffer);

  return data.text;
};

export const analyzeCvWithGemini = async (
  cvBuffer: Buffer,
  jobDescription: string
): Promise<any> => {
  try {
    const cvText = await extractTextFromPdf(cvBuffer);

    const prompt = `
    Analyze the following CV based on the job description provided.
    Extract the information in a structured JSON format.

    **Job Description:**
    ---
    ${jobDescription}
    ---

    **CV Content:**
    ---
    ${cvText}
    ---

    **Instructions:**
    1.  Extract skills (as a list of strings) and years_of_experience (as a number).
    2.  Score the CV from 0 to 100 on its suitability.
    3.  Provide a brief summary (2-3 sentences).
    4.  Determine the candidate's level (Intern, Junior, Mid-level, Senior).

    **Output MUST be a valid JSON object with the following keys:**
    {
        "extracted_info": { "skills": [], "years_of_experience": 0 },
        "suitability_score": 0,
        "summary": "...",
        "suggested_level": "..."
    }
    `;

    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const response = await axios.post(GEMINI_API_URL, payload);

    const resultText = response.data.candidates[0].content.parts[0].text;
    const cleanJsonStr = resultText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJsonStr);
  } catch (error: any) {
    console.error(
      "Error analyzing CV with Gemini:",
      error.response?.data || error.message
    );
    return null;
  }
};
