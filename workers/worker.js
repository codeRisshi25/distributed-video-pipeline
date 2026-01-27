import { createWorker } from "../shared/queue.js";
import { processJob } from "./processor.js";
import { logger } from "../shared/logger.js";

const worker = createWorker(processJob);

worker.on("completed", (job, result) => {
  logger.info({
    msg: "job_completed",
    jobId: job.id,
    result: result,
  });
});

worker.on("failed", (job, err) => {
  logger.error({
    msg: "job_failed",
    jobId: job.id,
    error: err.message,
    stack: err.stack,
  });
});

worker.on("error", (err) => {
  logger.error({
    msg: "worker_error",
    error: err.message,
    stack: err.stack,
  });
});

logger.info("Worker is running and waiting for jobs...");

process.on("SIGTERM", async () => {
  logger.info("Gracefully shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Gracefully shutting down worker...");
  await worker.close();
  process.exit(0);
});
