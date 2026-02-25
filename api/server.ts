import express from "express";
import dotenv from "dotenv";
import { createQueue } from "../shared/queue.js";
import { upload } from "./multer.js";
import { logger } from "../shared/logger.js";
import { fileHash } from "../shared/hash.js";
import { createClient } from "redis";
import { unlinkSync } from "fs";
// dashboard related stuff
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

const app = express();
const queue = createQueue();
dotenv.config();

const PORT = process.env.API_PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
  });
});

// BullMQ admin dashboard
const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter: serverAdapter,
});

// Redis connection for storing file hashes
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

await redisClient.connect();

serverAdapter.setBasePath("/admin/queues");

app.use("/admin/queues", serverAdapter.getRouter());

app.post("/api/convert", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "File not found",
      });
    }

    // Extract format and resolution FIRST
    const format = req.body.format || "mp4";
    const resolution = req.body.resolution || "original";

    // Check for duplicate file
    const hashOfFile = fileHash(req.file.path);
    const cacheKey = `processed:${hashOfFile}:${format}:${resolution}`;

    const existingJobId = await redisClient.get(cacheKey);
    if (existingJobId) {
      unlinkSync(req.file.path); // Delete duplicate upload

      logger.info({
        msg: "duplicate_detected",
        jobId: existingJobId,
        hash: hashOfFile,
      });

      return res.status(200).json({
        message: "Video already processed",
        jobId: existingJobId,
        cached: true,
      });
    }

    const jobData = {
      uploadPath: req.file.path,
      fileName: req.file.filename,
      format: format,
      resolution: resolution,
      uploadTime: new Date().toISOString(),
    };

    // Create the job
    const job = await queue.add("convert-video", jobData);

    // Store in cache (expires in 7 days)
    await redisClient.setEx(cacheKey, 7 * 24 * 60 * 60, job.id);

    logger.info({
      msg: "job_queued",
      jobId: job.id,
      hash: hashOfFile,
      data: jobData,
    });

    res.status(202).json({
      message: "Video processing",
      jobId: job.id,
      status: await job.getState(),
      data: jobData,
    });
  } catch (error) {
    logger.error({
      msg: "error_queueing_job",
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: "Failed to queue job" });
  }
});

// Job status endpoints
app.get("/api/jobs/:jobid", async (req, res) => {
  const job = await queue.getJob(req.params.jobid);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({
    jobId: job.id,
    state: await job.getState(),
    progress: job.progress || 0,
    data: job.data,
    result: job.returnvalue,
    error: job.failedReason,
    createdAt: job.timestamp,
    processedAt: job.processedOn,
    finishedAt: job.finishedOn,
    attemptsMade: job.attemptsMade,
  });
});

app.listen(PORT, () => logger.info(`video converter running on ${PORT}`));
