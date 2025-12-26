import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  department: z.string().min(2, "Department is required"),
  location: z.string().min(2, "Location is required"),
  employment_type: z.enum(["full-time", "part-time", "contract", "internship"]),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z
    .string()
    .min(30, "Requirements must be at least 30 characters"),
  salary_range: z.string().optional(),
  experience_level: z.enum(["entry", "mid", "senior", "lead"]),
  skills_required: z.array(z.string()).min(1, "At least one skill is required"),
  status: z.enum(["open", "closed", "draft"]).default("open"),
});

export type JobInput = z.infer<typeof jobSchema>;

export const updateJobSchema = jobSchema.partial();
