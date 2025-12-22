import axios from "axios";
import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { config } from "../config.ts";
import { supabase } from "./supabase.service.ts";

export interface CvEntities {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  languages?: string[];
}

export interface ParsedCv {
  text: string;
  meta: {
    pages?: number;
    fileName?: string | undefined;
    mimeType?: string | undefined;
    size?: number;
    fileType?: string;
  };
  entities?: CvEntities;
}

export const parsePdfBuffer = async (
  buffer: Buffer,
  meta?: {
    fileName?: string | undefined;
    mimeType?: string | undefined;
    size?: number | undefined;
  }
): Promise<ParsedCv> => {
  const parsed = await (pdfParse as any)(buffer);
  return {
    text: parsed.text || "",
    meta: {
      pages: parsed.numpages,
      fileName: meta?.fileName,
      mimeType: meta?.mimeType,
      size: meta?.size ?? buffer.length,
      fileType: "pdf",
    },
  };
};

export const parseDocxBuffer = async (
  buffer: Buffer,
  meta?: {
    fileName?: string | undefined;
    mimeType?: string | undefined;
    size?: number | undefined;
  }
): Promise<ParsedCv> => {
  const result = await mammoth.extractRawText({ buffer });
  return {
    text: result.value,
    meta: {
      fileName: meta?.fileName,
      mimeType: meta?.mimeType,
      size: meta?.size ?? buffer.length,
      fileType: "docx",
    },
  };
};

export const downloadFileToBuffer = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
};

/**
 * Download CV from Supabase storage and parse it
 */
export const downloadAndParseCv = async (
  storagePath: string
): Promise<ParsedCv> => {
  const { data, error } = await supabase.storage
    .from(config.supabase.bucket)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download CV: ${error?.message}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const ext = storagePath.split(".").pop()?.toLowerCase();

  const meta: { fileName?: string | undefined; size: number } = {
    fileName: storagePath.split("/").pop(),
    size: buffer.length,
  };

  if (ext === "pdf") {
    return parsePdfBuffer(buffer, meta);
  } else if (ext === "docx" || ext === "doc") {
    return parseDocxBuffer(buffer, meta);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
};

/**
 * Extract entities from CV text using regex patterns
 * (Simple implementation - can be enhanced with NER models)
 */
export const extractEntities = (text: string): CvEntities => {
  const entities: CvEntities = {
    skills: [],
    experience: [],
    education: [],
    languages: [],
  };

  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) entities.email = emailMatch[0];

  // Extract phone numbers (multiple formats)
  const phoneMatch = text.match(
    /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/
  );
  if (phoneMatch) entities.phone = phoneMatch[0];

  // Extract common tech skills
  const techSkills = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C#",
    "C++",
    "Ruby",
    "Go",
    "Rust",
    "PHP",
    "React",
    "Node.js",
    "Angular",
    "Vue",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Git",
    "CI/CD",
    "Agile",
    "Scrum",
    "REST API",
    "GraphQL",
    "TDD",
    "Express",
    "Django",
    "Flask",
    "Spring",
    "Laravel",
    ".NET",
  ];

  const lowerText = text.toLowerCase();
  entities.skills = techSkills.filter((skill) =>
    lowerText.includes(skill.toLowerCase())
  );

  // Extract languages
  const languages = [
    "English",
    "Vietnamese",
    "Chinese",
    "Japanese",
    "Korean",
    "French",
    "German",
    "Spanish",
  ];
  entities.languages = languages.filter((lang) =>
    lowerText.includes(lang.toLowerCase())
  );

  // Extract experience (years)
  const expMatches = text.match(/(\d+)\s*\+?\s*years?\s*(of\s*)?experience/gi);
  if (expMatches) {
    entities.experience = expMatches.map((m) => m.trim());
  }

  // Extract education keywords
  const eduKeywords = [
    "Bachelor",
    "Master",
    "PhD",
    "Degree",
    "University",
    "College",
  ];
  const eduMatches: string[] = [];
  eduKeywords.forEach((keyword) => {
    const regex = new RegExp(`${keyword}[^.\\n]{0,100}(?:\\.|\\n)`, "gi");
    const matches = text.match(regex);
    if (matches) eduMatches.push(...matches);
  });
  entities.education = eduMatches.map((m) => m.trim());

  return entities;
};

/**
 * Complete CV parsing with entity extraction
 */
export const parseAndExtractCv = async (
  storagePath: string
): Promise<ParsedCv> => {
  const parsed = await downloadAndParseCv(storagePath);
  parsed.entities = extractEntities(parsed.text);
  return parsed;
};
