import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { config } from "./config.ts";
import decisionRoutes from "./routes/decision.routes.ts";
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
    message: "AI Recruitment Agent API - Simple Mode (No Redis)",
    version: "1.0.0",
    endpoints: {
      decision: "/api/decision",
      health: "/health",
    },
  });
});

// Supabase connection health check
app.get("/health", async (req, res) => {
  try {
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
      });
    }

    res.json({
      status: "healthy",
      supabase: "connected",
      database: "accessible",
      timestamp: new Date().toISOString(),
      candidatesCount: count || 0,
    });
  } catch (error: any) {
    console.error("Health check exception:", error);
    res.status(503).json({
      status: "unhealthy",
      supabase: "error",
      error: error?.message || String(error),
    });
  }
});

// Routes
app.use("/api/decision", decisionRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Supabase URL: ${config.supabase.url}`);
});
