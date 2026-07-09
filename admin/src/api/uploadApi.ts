import { api } from './axios';

export type UploadKind = 'poster' | 'banner' | 'trailer' | 'video';

export interface UploadResult {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  fieldname: string;
  jobId?: string; // Present for video HLS transcoding uploads
  status?: string;
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  hlsMasterPlaylistUrl: string;
  qualities: Array<{
    resolution: '240p' | '360p' | '480p' | '720p' | '1080p';
    url: string;
    bitrate?: number;
  }>;
  error?: string;
}

export async function uploadFile(
  kind: UploadKind,
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append(kind, file);

  const res = await api.post<{ success: boolean; data: UploadResult }>(`/uploads/${kind}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  return res.data.data;
}

export async function getTranscodeStatus(jobId: string): Promise<JobStatus> {
  const res = await api.get<{ success: boolean; data: JobStatus }>(`/uploads/jobs/${jobId}`);
  return res.data.data;
}
