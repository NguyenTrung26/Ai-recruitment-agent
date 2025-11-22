import { z } from "zod";

export const candidateApplicationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
  position_applied: z.string().min(2, "Position is required"),
});
