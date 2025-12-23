import pino from "pino";
import type { LoggerOptions } from "pino";
import { config } from "../config.ts";

const transportConfig =
  process.env.NODE_ENV !== "production"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined;

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  base: {
    env: process.env.NODE_ENV || "development",
  },
};

if (transportConfig) {
  loggerOptions.transport = transportConfig;
}

export const logger = pino(loggerOptions);

export const createRequestLogger = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = req.headers["x-request-id"] || Math.random().toString(36).substring(7);
    
    req.log = logger.child({ requestId, path: req.path, method: req.method });
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      req.log.info({
        statusCode: res.statusCode,
        duration,
        msg: `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
      });
    });
    
    next();
  };
};
