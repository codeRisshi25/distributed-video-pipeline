import express from 'express';
import dotenv from 'dotenv';
import { createQueue } from '../shared/queue.ts';
import { upload } from './multer.ts';
import { logger } from '../shared/logger.ts';
import { fileHash } from '../shared/hash.ts';
import { createClient } from 'redis';
import { unlinkSync } from 'fs';
// dashboard related stuff
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
//* import types
import type { Format, Resolution, VideoJob, JobStatusResponse } from '../shared/types';
import type { Job } from 'bullmq';

const app = express();
const queue = createQueue();
dotenv.config();

const PORT = process.env.API_PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
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
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

redisClient.on('error', (err) => {
  logger.error({ message: 'redis client error', error: err });
});
// connecting correctly while handling errors
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('redis connected...!');
  } catch (err) {
    logger.error({ message: 'error while connecting to redis', error: err });
  }
};

serverAdapter.setBasePath('/admin/queues');

app.use('/admin/queues', serverAdapter.getRouter());

app.post(
  '/api/convert',
  upload.single('video'),
  async (
    req: express.Request<{ format?: Format; resolution?: Resolution }>,
    res: express.Response<{ jobId: string; message: string } | { error: string }>,
  ) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'File not found',
        });
      }

      // Extract format and resolution FIRST
      const format: Format = req.body.format || 'mp4';
      const resolution: Resolution = req.body.resolution || 'original';

      // Check for duplicate file
      const hashOfFile = fileHash(req.file.path);
      const cacheKey = `processed:${hashOfFile}:${format}:${resolution}`;

      const existingJobId = await redisClient.get(cacheKey);
      if (existingJobId) {
        unlinkSync(req.file.path); // Delete duplicate upload

        logger.info({
          msg: 'duplicate_detected',
          jobId: existingJobId,
          hash: hashOfFile,
        });

        return res.status(200).json({
          message: 'Video already processed',
          jobId: existingJobId,
        });
      }

      const jobData: VideoJob = {
        uploadPath: req.file.path,
        fileName: req.file.filename,
        format: format,
        resolution: resolution,
        uploadTime: new Date().toISOString(),
      };

      // Create the job
      const job: Job<VideoJob> = await queue.add('convert-video', jobData);

      // Store in cache (expires in 7 days)
      await redisClient.setEx(cacheKey, 7 * 24 * 60 * 60, job.id || 'null');

      logger.info({
        msg: 'job_queued',
        jobId: job.id,
        hash: hashOfFile,
        data: jobData,
      });

      res.status(202).json({
        message: 'Video processing',
        jobId: job.id ?? 'unknown',
      });
    } catch (error) {
      logger.error({
        msg: 'error_queueing_job',
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      return res.status(500).json({ error: 'Failed to queue job' });
    }
  },
);

// Job status endpoints
app.get(
  '/api/jobs/:jobid',
  async (
    req: express.Request<{ jobid: string }>,
    res: express.Response<JobStatusResponse | { error: string }>,
  ) => {
    const job: Job<VideoJob> | undefined = await queue.getJob(req.params.jobid);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const response: JobStatusResponse = {
      jobId: job.id || 'unknown',
      state: await job.getState(),
      progress: (job.progress as number) || 0,
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      attemptsMade: job.attemptsMade,
    };
    res.json(response);
  },
);

app.listen(PORT, () => logger.info(`video converter running on ${PORT}`));

const startServer = async () => {
  try {
    await connectRedis();

    app.listen(PORT, () => logger.info(`video converter running on ${PORT}`));
  } catch (err) {
    logger.error({ message: 'server startup error', error: err });
  }
};

startServer();
