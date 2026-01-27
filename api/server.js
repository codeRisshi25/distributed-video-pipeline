import express from "express";
import dotenv from "dotenv";
import { createQueue } from "../shared/queue.js";
import { upload } from "./multer.js";
import { logger } from "../shared/logger.js";
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

serverAdapter.setBasePath("/admin/queues");

app.use("/admin/queues", serverAdapter.getRouter());

app.post("/api/convert", upload.single("video"), async (req, res) => {
  // By now i will have req.file -> file info
  // req.body -> file metadata
  // the actual file in uploads

  // gotta check if file exists
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "File not found",
      });
    }

    const format = req.body.format || "mp4";
    const resolution = req.body.resolution || "original";

    const jobData = {
      uploadPath: req.file.path,
      fileName: req.file.filename,
      format: format,
      resolution: resolution,
      uploadTime: new Date().toISOString(),
    };

    // create the job
    const job = await queue.add("convert-video", jobData);

    res.status(202).json({
      message: "Video processing",
      jobId: job.id,
      status: await job.getState(),
      data: jobData,
    });

    logger.info({
      msg: "job_queued",
      jobId: job.id,
      data: jobData,
    });
  } catch (error) {
    logger.error("error while quesing job =>\n", error);
    return res.status(500).json({ error: "Failed to queue job " });
  }
});

app.listen(PORT, () => logger.info(`video converter running on ${PORT}`));
