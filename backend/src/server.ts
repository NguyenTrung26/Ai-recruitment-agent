import express from "express";
import { config } from "./config.ts";
import candidateRoutes from "./routes/candidate.routes.ts";
import jobRoutes from "./routes/job.routes.ts";
import statisticsRoutes from "./routes/statistics.routes.ts";
import aiRoutes from "./routes/ai.routes.ts";
import webhookRoutes from "./routes/webhook.routes.ts";
import {
  errorHandler,
  requestLogger,
  corsMiddleware,
} from "./middleware/index.ts";
import {
  rateLimitMiddleware,
  errorHandler as securityErrorHandler,
} from "./middleware/security.middleware.ts";
import { logger, createRequestLogger } from "./services/logger.service.ts";
import "./queue/index.ts";

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(createRequestLogger()); // Enhanced logger with request tracking
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting if enabled
if (config.security.enableRateLimit) {
  app.use(rateLimitMiddleware);
  logger.info("Rate limiting enabled");
}

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the AI Recruitment Agent API",
    version: "2.0.0",
    environment: config.env,
    features: [
      "AI-powered CV analysis (Gemini)",
      "Multi-criteria scoring",
      "Automated notifications (Email, Slack, Teams)",
      "n8n workflow integration",
      "BullMQ job queue",
      "PDF/DOCX parsing",
      "Entity extraction",
      "Status history tracking",
    ],
    endpoints: {
      candidates: "/api/candidates",
      candidateIntake: "/api/candidates/intake",
      jobs: "/api/jobs",
      statistics: "/api/statistics",
      ai: "/api/ai",
      webhooks: "/api/webhooks",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: config.redis.url,
  });
});

// Routes
app.use("/api", candidateRoutes);
app.use("/api", jobRoutes);
app.use("/api", statisticsRoutes);
app.use("/api", aiRoutes);
app.use("/api/webhooks", webhookRoutes);

// Error handlers (must be last)
app.use(errorHandler);
app.use(securityErrorHandler);

const server = app.listen(config.port, () => {
  logger.info({
    port: config.port,
    env: config.env,
    redis: config.redis.url,
  }, "🚀 Server started");
  console.log(`Server is running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Redis: ${config.redis.url}`);
  console.log(`n8n callback: ${config.n8n.callbackUrl || "not configured"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});
