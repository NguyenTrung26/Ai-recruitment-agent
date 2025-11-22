import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  supabase: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL!,
  },
};
