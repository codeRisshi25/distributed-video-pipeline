import { spawn } from "child_process";
import { logger } from "../shared/logger";

export const processJob = async (job) => {
  const { uploadPath, format, resolution } = job.data;
  const outputPath = `./outputs/${job.id}-conv.${format}`;

  const args = [
    "-i",
    uploadPath,
    "-c:v",
    "libx264",
    "-crf",
    23,
    "-y",
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    let stderrData = "";

    ffmpeg.stderr.on("data", (data) => {
      stderrData += data.toString();
      logger.info("📊 FFmpeg progress:", data.toString().slice(0, 100));
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
