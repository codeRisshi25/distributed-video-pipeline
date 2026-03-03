import { Queue, Worker, Job } from "bullmq";
import dotenv from "dotenv";
import type { VideoJob } from "./types";

dotenv.config();

// redis connection - ill use it for metadata and job details
export const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
};

export const QUEUE_NAME = "video-conversion";

// create a queue instance
export const createQueue = () => {
  return new Queue(QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600,
        count: 100,
      },
      removeOnFail: {
        age: 86400,
      },
    },
  });
};

export const createWorker = (processor: (job: Job<VideoJob>) => Promise<any>) => {
  return new Worker(QUEUE_NAME, processor, {
    connection: redisConnection,
    concurrency: 2,
  });
};
