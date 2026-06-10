import { createWorker } from "@vid_converter/shared";
import { processJob } from "./processor.js";
import { logger } from "@vid_converter/shared";
import { unlinkSync } from "fs";
import type { Job } from "bullmq";
import type { VideoJob } from "@vid_converter/shared";

const worker = createWorker(processJob);

worker.on("completed", (job: Job<VideoJob>, result: unknown) => {
  // delete the input file after successful conversion
  try {
    unlinkSync(job.data.uploadPath);
    logger.info({ msg: "input_file_deleted", path: job.data.uploadPath });
  } catch (error) {
    logger.warn({ msg: "file_delete_failed", error: (error as Error).message });
  }

  logger.info({
    msg: "job_completed",
    jobId: job.id,
    result,
  });
});

worker.on("failed", (job: Job<VideoJob> | undefined, err: Error) => {
  logger.error({
    msg: "job_failed",
    jobId: job?.id,
    error: err.message,
    stack: err.stack,
  });
});

worker.on("error", (err: Error) => {
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
