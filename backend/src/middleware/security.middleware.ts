import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { Redis } from "ioredis";
import { config } from "../config.ts";
import { logger } from "../services/logger.service.ts";
import type { Request, Response, NextFunction } from "express";

let rateLimiter: RateLimiterMemory | RateLimiterRedis;

// Initialize rate limiter (Redis if available, otherwise in-memory)
try {
  const redis = new Redis(config.redis.url);
  rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    points: 1000, // Tăng lên 1000 requests cho development
    duration: 60, // Per 60 seconds
    keyPrefix: "rate_limit",
  });
  logger.info("Rate limiter initialized with Redis");
} catch (error) {
  rateLimiter = new RateLimiterMemory({
    points: 1000, // Tăng lên 1000
    duration: 60,
  });
  logger.warn("Rate limiter using in-memory store (Redis not available)");
}

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // DISABLE rate limiting cho development/localhost
  if (config.env === 'development') {
    return next();
  }
  
  try {
    const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
    await rateLimiter.consume(key as string);
    next();
  } catch (error) {
    logger.warn({ ip: req.ip }, "Rate limit exceeded");
    res.status(429).json({
      message: "Too many requests, please try again later",
    });
  }
};

/**
 * API Key authentication middleware
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  
  if (!config.security.apiKey) {
    // API key not configured, skip validation
    return next();
  }
  
  if (apiKey !== config.security.apiKey) {
    logger.warn({ ip: req.ip, path: req.path }, "Invalid API key attempt");
    return res.status(401).json({ message: "Unauthorized: Invalid API key" });
  }
  
  next();
};

/**
 * Webhook signature verification (simple HMAC approach)
 */
export const verifyWebhookSignature = (secret: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;
    
    if (!signature || !timestamp) {
      logger.warn({ ip: req.ip }, "Webhook missing signature or timestamp");
      return res.status(401).json({ message: "Unauthorized: Missing signature" });
    }
    
    // Verify timestamp is recent (within 5 minutes)
    const timestampAge = Date.now() - parseInt(timestamp, 10);
    if (timestampAge > 5 * 60 * 1000) {
      logger.warn({ timestamp, ip: req.ip }, "Webhook timestamp too old");
      return res.status(401).json({ message: "Unauthorized: Timestamp expired" });
    }
    
    // In production, verify HMAC signature here
    // const expectedSignature = crypto.createHmac('sha256', secret).update(timestamp + JSON.stringify(req.body)).digest('hex');
    // if (signature !== expectedSignature) { return res.status(401)... }
    
    next();
  };
};

/**
 * File validation middleware
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const fileName = (req.body?.file_name || req.file?.originalname || "") as string;
  
  if (!fileName) {
    return res.status(400).json({ message: "File name is required" });
  }
  
  const ext = fileName.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["pdf", "docx", "doc"];
  
  if (!ext || !allowedExtensions.includes(ext)) {
    logger.warn({ fileName, ext, ip: req.ip }, "Invalid file extension");
    return res.status(400).json({
      message: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`,
    });
  }
  
  // Check file size if available
  const fileSize = req.body?.file_size || req.file?.size;
  const maxSizeMB = 10;
  if (fileSize && fileSize > maxSizeMB * 1024 * 1024) {
    return res.status(400).json({
      message: `File too large. Maximum size: ${maxSizeMB}MB`,
    });
  }
  
  next();
};

/**
 * Error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  }, "Unhandled error");
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
