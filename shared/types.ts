export type Format = "mp4" | "mpeg" | "webm";
export type Resolution = "original" | "720p" | "480p" | "360p" | "240p";
export interface VideoJob {
  uploadPath: string;
  fileName: string;
  format: Format;
  resolution: Resolution;
  uploadTime: string;
}
export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  message: string;
}
export interface JobStatusResponse {
  jobId: string;
  state: string;
  progress: number;
  data: VideoJob;
  result?: ConversionResult;
  error?: string;
  createdAt: number;
  processedAt: number | undefined;
  finishedAt: number | undefined;
  attemptsMade: number;
}
