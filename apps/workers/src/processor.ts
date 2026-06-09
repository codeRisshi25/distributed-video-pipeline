import { spawn } from "child_process";
import { logger } from "@vid_converter/shared";
import type { Job } from "bullmq";
import type { VideoJob, ConversionResult } from "@vid_converter/shared";

export const processJob = async (job: Job<VideoJob>): Promise<ConversionResult> => {
  const { uploadPath, format, resolution } = job.data;
  const outputPath = `./outputs/${job.id}-conv.${format}`;

  const mp4ToMpeg: string[] = [
    "-i",
    uploadPath,
    "-f",
    "mpeg",
    "-r",
    "25",
    "-progress",
    "-",
    "-nostats",
    outputPath,
  ];

  const resolutionChange: string[] = [
    "-i",
    uploadPath,
    "-vf",
    `scale=${resolution.split("x")[0]}:${resolution.split("x")[1]}`,
    "-progress",
    "-",
    "-nostats",
    outputPath,
  ];

  const args = resolution !== "original" ? resolutionChange : mp4ToMpeg;

  return new Promise<ConversionResult>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    let stderrData = "";
    let totalDuration = 0;
    let lastProgress = -1;

    ffmpeg.stderr.on("data", (data: Buffer) => {
      const output = data.toString();
      stderrData += output;

      // Parse total duration from FFmpeg output (only once)
      if (totalDuration === 0) {
        const durationMatch = output.match(
          /Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/,
        );
        if (durationMatch) {
          const hours = parseInt(durationMatch[1] ?? "0");
          const minutes = parseInt(durationMatch[2] ?? "0");
          const seconds = parseFloat(durationMatch[3] ?? "0");
          totalDuration = (hours * 3600 + minutes * 60 + seconds) * 1000000; // microseconds
          logger.info({
            msg: "duration_parsed",
            jobId: job.id,
            totalDuration: totalDuration / 1000000,
          });
        }
      }
    });

    ffmpeg.stdout.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("out_time_us=")) {
          const currentTime = parseInt(line.split("=")[1] ?? "0");

          if (totalDuration > 0 && currentTime > 0) {
            const progress = Math.floor((currentTime / totalDuration) * 100);
            if (progress > lastProgress && progress <= 100) {
              lastProgress = progress;
              void job.updateProgress(progress);
              logger.info({ msg: "progress_update", jobId: job.id, progress });
            }
          }
        }
      }
    });

    ffmpeg.on("error", (error: Error) => {
      reject(
        new Error(`error while trying to start ffmpeg =>\n ${error.message}`),
      );
    });

    ffmpeg.on("close", (code: number | null) => {
      if (code === 0) {
        resolve({
          success: true,
          outputPath,
          message: "video converted successfully",
        });
      } else {
        reject(
          new Error(
            `ffmpeg failed with exit code ${code}. Error: ${stderrData}`,
          ),
        );
      }
    });
  });
};
