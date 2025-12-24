import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import {
  analyzeCandidateJob,
  type AnalyzeCandidatePayload,
} from "../jobs/analyzeCandidate.ts";
import { config } from "../config.ts";
import { logger } from "../services/logger.service.ts";

const connection = new IORedis.default(config.redis.url, {
  maxRetriesPerRequest: null, // required by BullMQ
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 1000, 10000);
    logger.warn(`Redis connection retry attempt ${times}, delay ${delay}ms`);
    return delay;
  },
});

connection.on("connect", () => {
  logger.info("Redis connected for BullMQ");
});

connection.on("error", (error: Error) => {
  logger.error({ error: error.message }, "Redis connection error");
});

export const candidateQueueName = "candidate-analysis";
export const candidateQueue = new Queue<AnalyzeCandidatePayload>(
  candidateQueueName,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600, // keep for 24h
        count: 100,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // keep failed for 7 days
      },
    },
  }
);

// Queue events for monitoring
const queueEvents = new QueueEvents(candidateQueueName, { connection });

queueEvents.on("completed", ({ jobId }) => {
  logger.info({ jobId, queue: candidateQueueName }, "Job completed");
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(
    { jobId, failedReason, queue: candidateQueueName },
    "Job failed"
  );
});

queueEvents.on("stalled", ({ jobId }) => {
  logger.warn({ jobId, queue: candidateQueueName }, "Job stalled");
});

// Worker processes jobs immediately when server is running
const worker = new Worker(candidateQueueName, analyzeCandidateJob, {
  connection,
  concurrency: 2,
  limiter: {
    max: 10,
    duration: 60000, // 10 jobs per minute
  },
});

worker.on("completed", (job) => {
  logger.info(
    {
      jobId: job.id,
      candidateId: job.data.candidateId,
      duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
    },
    "Worker completed job"
  );
});

worker.on("failed", (job, error) => {
  logger.error(
    {
      jobId: job?.id,
      candidateId: job?.data?.candidateId,
      error: error.message,
      attempts: job?.attemptsMade,
    },
    "Worker failed job"
  );
});

worker.on("error", (error) => {
  logger.error({ error: error.message }, "Worker error");
});

export const enqueueCandidateAnalysis = async (
  payload: AnalyzeCandidatePayload
) => {
  const job = await candidateQueue.add("analyze-candidate", payload, {
    jobId: `candidate-${payload.candidateId}-${Date.now()}`,
  });

  logger.info(
    {
      jobId: job.id,
      candidateId: payload.candidateId,
      jobId_num: payload.jobId,
    },
    "Job enqueued"
  );

  return job;
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing worker and queue");
  await worker.close();
  await candidateQueue.close();
  await connection.quit();
});
