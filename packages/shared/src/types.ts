export type Format = 'mp4' | 'mpeg' | 'webm';
export type Resolution = 'original' | '1280x720' | '480x270' | '360x202' | '240x135';
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
