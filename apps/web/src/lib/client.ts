import { QueryClient } from '@tanstack/react-query';
import type { JobStatusResponse, Format, Resolution } from '@vid_converter/shared';

// Initialize the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

/**
 * Route Mappings Description:
 * 
 * 1. Health Check
 *    - Backend: `GET /health`
 *    - Description: Simple endpoint to check if the API is running.
 * 
 * 2. Upload Video for Conversion
 *    - Backend: `POST /api/convert`
 *    - Frontend Fetcher: `uploadVideo`
 *    - Description: Accepts a `multipart/form-data` payload containing a video file, format, and resolution.
 *      Checks if the file has been processed before (using hash). Adds the job to BullMQ and returns a `jobId`.
 * 
 * 3. Get Job Status
 *    - Backend: `GET /api/jobs/:jobid`
 *    - Frontend Fetcher: `getJobStatus`
 *    - Description: Retrieves the current status, progress, and result of a conversion job from BullMQ.
 * 
 * 4. BullMQ Admin Dashboard (Not mapped in frontend client)
 *    - Backend: `GET /admin/queues`
 *    - Description: Provides a UI to monitor and manage background queues.
 */

export interface UploadVideoParams {
  file: File;
  format: Format;
  resolution: Resolution;
}

export interface UploadVideoResponse {
  jobId: string;
  message: string;
  error?: string;
}

export const uploadVideo = async (params: UploadVideoParams): Promise<UploadVideoResponse> => {
  const formData = new FormData();
  formData.append('video', params.file);
  formData.append('format', params.format);
  formData.append('resolution', params.resolution);

  const response = await fetch('/api/convert', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload video');
  }

  return response.json();
};

export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const response = await fetch(`/api/jobs/${jobId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to get job status');
  }

  return response.json();
};
