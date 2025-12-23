import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  env: process.env.NODE_ENV || "development",
  supabase: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!,
    bucket: process.env.SUPABASE_BUCKET || "cvs",
    signedUrlExpiresInSeconds: Number(process.env.SIGNED_URL_EXPIRES_IN_SECONDS || 600),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL!,
    callbackUrl: process.env.N8N_CALLBACK_URL || "",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  security: {
    apiKey: process.env.API_KEY || "",
    webhookSecret: process.env.WEBHOOK_SECRET || "",
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== "false",
  },
  email: {
    from: process.env.EMAIL_FROM || "noreply@recruitment.com",
    webhookUrl: process.env.EMAIL_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL,
  },
  notifications: {
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL || "",
    },
    teams: {
      webhookUrl: process.env.TEAMS_WEBHOOK_URL || "",
    },
  },
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:3000",
  },
  calendly: {
    link: process.env.CALENDLY_LINK || "",
  },
};
