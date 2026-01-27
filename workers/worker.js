import { createWorker } from "../shared/queue.js";
import { processJob } from "./processor.js";

const worker = createWorker(processJob);

worker.on("completed", (job, result) => {
  console.log(` Job ${job.id} completed successfully`, result);
});

worker.on("failed", (job, err) => {
  console.log(` Job ${job.id} failed with error: ${err.message}`);
});

worker.on("error", (err) => {
  console.error(" Worker encountered an error:", err);
});

console.log("Worker is running and waiting for jobs...");

process.on("SIGTERM", async () => {
  console.log("Gracefully shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Gracefully shutting down worker...");
  await worker.close();
  process.exit(0);
});
