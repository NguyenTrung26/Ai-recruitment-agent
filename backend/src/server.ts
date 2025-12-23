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
    },
  });
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
