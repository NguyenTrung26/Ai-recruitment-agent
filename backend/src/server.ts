import express from "express";
import { config } from "./config.ts";
import candidateRoutes from "./routes/candidate.routes.ts";
import jobRoutes from "./routes/job.routes.ts";
import statisticsRoutes from "./routes/statistics.routes.ts";
import aiRoutes from "./routes/ai.routes.ts";
import decisionRoutes from "./routes/decision.routes.ts";
import cvRoutes from "./routes/cv.routes.ts";
import {
  errorHandler,
  requestLogger,
  corsMiddleware,
} from "./middleware/index.ts";
import { supabase } from "./services/supabase.service.ts";

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the AI Recruitment Agent API",
    version: "1.0.0",
    endpoints: {
      candidates: "/api/candidates",
      jobs: "/api/jobs",
      statistics: "/api/statistics",
      ai: "/api/ai",
      health: "/health",
    },
  });
});

// Supabase connection health check
app.get("/health", async (req, res) => {
  try {
    // Test Supabase connection by querying candidates table
    const { data, error, count } = await supabase
      .from("candidates")
      .select("id", { count: "exact" })
      .limit(1);

    if (error) {
      console.error("Health check Supabase error:", error);
      return res.status(503).json({
        status: "unhealthy",
        supabase: "disconnected",
        error: error.message || String(error),
        details: {
          code: error.code,
          hint: (error as any)?.hint,
          details: (error as any)?.details,
          raw: JSON.stringify(error),
        },
      });
    }

    res.json({
      status: "healthy",
      supabase: "connected",
      database: "accessible",
      timestamp: new Date().toISOString(),
      candidatesCount: count || 0,
      config: {
        url: config.supabase.url,
        bucket: config.supabase.bucket,
      },
    });
  } catch (error: any) {
    console.error("Health check exception:", error);
    res.status(503).json({
      status: "unhealthy",
      supabase: "error",
      error: error?.message || String(error),
      stack: error?.stack,
    });
  }
});

// Routes
app.use("/api", candidateRoutes);
app.use("/api", jobRoutes);
app.use("/api", statisticsRoutes);
app.use("/api", aiRoutes);
app.use("/api/decision", decisionRoutes);
app.use("/api/cv", cvRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
