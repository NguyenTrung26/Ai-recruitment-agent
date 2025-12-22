import { z } from "zod";

export const candidateIntakeSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  job_id: z.string().optional(),
  position_applied: z.string().optional(),
  source: z.string().optional(),
  file_name: z.string().optional(),
});

export type CandidateIntakeInput = z.infer<typeof candidateIntakeSchema>;
