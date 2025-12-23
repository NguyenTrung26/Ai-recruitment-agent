import type { Request, Response, NextFunction } from "express";
import { config } from "../config.ts";

// Global error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.errors,
    });
  }

  // Database errors
  if (err.code === "PGRST116") {
    return res.status(404).json({
      message: "Resource not found",
    });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Request logger middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });
  next();
};

// CORS middleware
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
};

// API key authentication middleware (optional for N8N webhooks)
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = config.security.apiKey;

  if (!validApiKey) {
    return next(); // Skip if no API key configured
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }

  next();
};
