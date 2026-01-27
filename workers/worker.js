import { createWorker } from "../shared/queue.js";
import { processJob } from "./processor.js";
import { logger } from "../shared/logger.js";

const worker = createWorker(processJob);

worker.on("completed", (job, result) => {
  logger.info("job completed successfully:", {
    jobId: job.id,
    result: result,
  });
});

worker.on("failed", (job, err) => {
  logger.error("job failed:", {
    jobId: job.id,
    error: err.message,
  });
});

worker.on("error", (err) => {
  logger.error("Worker encountered an error:", err);
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
