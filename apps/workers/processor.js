import { spawn } from "child_process";
import { logger } from "../shared/logger.js";


export const processJob = async (job) => {
  const { uploadPath, format, resolution } = job.data;
  const outputPath = `./outputs/${job.id}-conv.${format}`;

  const mp4ToMpeg = [
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

  const resolutionChange = [
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

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    let stderrData = "";
    let totalDuration = 0;
    let lastProgress = -1;

    ffmpeg.stderr.on("data", (data) => {
      const output = data.toString();
      stderrData += output;

      // Parse total duration from FFmpeg output (only once)
      if (totalDuration === 0) {
        const durationMatch = output.match(
          /Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/,
        );
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseFloat(durationMatch[3]);
          totalDuration = (hours * 3600 + minutes * 60 + seconds) * 1000000; // Convert to microseconds
          logger.info({
            msg: "duration_parsed",
            jobId: job.id,
            totalDuration: totalDuration / 1000000,
          });
        }
      }
    });

    ffmpeg.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("out_time_us=")) {
          const currentTime = parseInt(line.split("=")[1]);

          if (totalDuration > 0 && currentTime > 0) {
            const progress = Math.floor((currentTime / totalDuration) * 100);
            if (progress > lastProgress && progress <= 100) {
              lastProgress = progress;
              job.updateProgress(progress);
              logger.info({ msg: "progress_update", jobId: job.id, progress });
            }
          }
        }
      }
    });

    ffmpeg.on("error", (error) => {
      reject(
        new Error(`error while trying to start ffmpeg =>\n ${error.message}`),
      );
    });

    ffmpeg.on("close", (code) => {
      if (code == 0) {
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
