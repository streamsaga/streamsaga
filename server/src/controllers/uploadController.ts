import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { uploadFile, isR2Enabled, s3Client } from '../utils/r2Service';
import { TranscodeJob } from '../models/TranscodeJob';
import { User } from '../models/User';
import { transcodeQueue } from '../utils/transcodeQueue';
import { AuthenticatedRequest } from '../middleware/auth';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';

export const uploadAsset = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, 'No file was uploaded');
  }

  const fieldname = file.fieldname;
  const originalName = file.originalname;
  const ext = path.extname(originalName);

  // Check if it's a main video file that needs HLS transcoding
  if (fieldname === 'video') {
    const jobId = `job-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    
    // Resolve user's name to use as their upload subfolder
    const userObj = await User.findById(req.user?.userId);
    const userName = userObj ? userObj.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'anonymous';
    
    const remoteKey = `transcoded/${userName}/${jobId}/master.m3u8`;

    // Calculate the future master playlist URL
    let futurePlaylistUrl = '';
    if (isR2Enabled()) {
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      const encodedKey = remoteKey.split('/').map(encodeURIComponent).join('/');
      if (R2_PUBLIC_URL) {
        futurePlaylistUrl = `${R2_PUBLIC_URL}/${encodedKey}`;
      } else {
        futurePlaylistUrl = `${req.protocol}://${req.get('host')}/api/stream/r2/${encodedKey}`;
      }
    } else {
      futurePlaylistUrl = `${req.protocol}://${req.get('host')}/uploads/${remoteKey}`;
    }

    // Capture potential associated movie or episode ids
    const movieId = req.body.movieId || req.query.movieId;
    const episodeId = req.body.episodeId || req.query.episodeId;

    // Create TranscodeJob record in DB
    const job = await TranscodeJob.create({
      status: 'queued',
      progress: 0,
      hlsMasterPlaylistUrl: futurePlaylistUrl,
      originalName,
      size: file.size,
      mimeType: file.mimetype,
      movieId: movieId ? movieId : undefined,
      episodeId: episodeId ? episodeId : undefined,
    });

    // Enqueue the background transcoding task
    transcodeQueue.enqueue(jobId, file.path, userName);

    return res.status(201).json({
      success: true,
      data: {
        url: futurePlaylistUrl,
        jobId,
        status: 'queued',
        originalName,
        size: file.size,
        mimeType: file.mimetype,
        fieldname,
      },
    });
  }

  // Otherwise, handle regular direct upload (poster, banner, trailer)
  try {
    const subfolder = fieldname === 'poster' ? 'posters' : fieldname === 'banner' ? 'banners' : 'trailers';
    const remoteKey = `${subfolder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    
    const publicUrl = await uploadFile(file.path, remoteKey, file.mimetype);

    res.status(201).json({
      success: true,
      data: {
        url: publicUrl,
        originalName,
        size: file.size,
        mimeType: file.mimetype,
        fieldname,
      },
    });
  } catch (err: any) {
    // Make sure we delete local uploaded file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new ApiError(500, `Upload failed: ${err.message}`);
  }
});

/**
 * Gets the current status of an HLS transcode job
 */
export const getTranscodeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  
  // Find transcode job containing the jobId in its playlist URL
  const job = await TranscodeJob.findOne({ hlsMasterPlaylistUrl: new RegExp(jobId) });
  if (!job) {
    throw new ApiError(404, 'Transcode job not found');
  }

  res.json({
    success: true,
    data: {
      jobId,
      status: job.status,
      progress: job.progress,
      hlsMasterPlaylistUrl: job.hlsMasterPlaylistUrl,
      qualities: job.qualities,
      error: job.error,
    },
  });
});

/**
 * Generates a presigned PUT URL for direct client-to-R2 large file uploads
 */
export const getPresignedUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { filename, contentType, kind } = req.query as { filename?: string; contentType?: string; kind?: string };

  if (!filename || !contentType) {
    throw new ApiError(400, 'filename and contentType are required query parameters');
  }

  if (!s3Client || !process.env.R2_BUCKET) {
    throw new ApiError(500, 'Cloudflare R2 storage is not configured/enabled');
  }

  const ext = path.extname(filename);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  
  // Scaffolding folders
  let folder = 'temp';
  if (kind === 'video') {
    folder = 'raw-videos';
  } else if (kind === 'poster') {
    folder = 'posters';
  } else if (kind === 'banner') {
    folder = 'banners';
  } else if (kind === 'trailer') {
    folder = 'trailers';
  }

  const key = `${folder}/${unique}${ext}`;
  const bucket = process.env.R2_BUCKET;

  // Generate presigned PUT URL (valid for 1 hour)
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  // Calculate future stream/asset URL
  let publicUrl = '';
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  if (R2_PUBLIC_URL) {
    publicUrl = `${R2_PUBLIC_URL}/${encodedKey}`;
  } else {
    publicUrl = `${req.protocol}://${req.get('host')}/api/stream/r2/${encodedKey}`;
  }

  res.status(200).json({
    success: true,
    data: {
      presignedUrl,
      key,
      publicUrl,
    },
  });
});

/**
 * Enqueues a transcoding job for an already uploaded R2 raw video file
 */
export const transcodeR2Video = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { key, movieId, episodeId } = req.body;

  if (!key) {
    throw new ApiError(400, 'R2 object key is required');
  }

  if (!s3Client || !process.env.R2_BUCKET) {
    throw new ApiError(500, 'Cloudflare R2 storage is not configured/enabled');
  }

  // 1. Verify object exists in R2 using HeadObject
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      })
    );
  } catch (err: any) {
    throw new ApiError(404, `Video file key "${key}" not found in Cloudflare R2: ${err.message}`);
  }

  // 2. Prepare transcode job metadata
  const jobId = `job-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  
  // Resolve user's name
  const userObj = await User.findById(req.user?.userId);
  const userName = userObj ? userObj.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'anonymous';

  const remoteKey = `transcoded/${userName}/${jobId}/master.m3u8`;

  let futurePlaylistUrl = '';
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
  const encodedKey = remoteKey.split('/').map(encodeURIComponent).join('/');
  if (R2_PUBLIC_URL) {
    futurePlaylistUrl = `${R2_PUBLIC_URL}/${encodedKey}`;
  } else {
    futurePlaylistUrl = `${req.protocol}://${req.get('host')}/api/stream/r2/${encodedKey}`;
  }

  // Create TranscodeJob record
  const job = await TranscodeJob.create({
    status: 'queued',
    progress: 0,
    hlsMasterPlaylistUrl: futurePlaylistUrl,
    originalName: path.basename(key),
    size: 0,
    mimeType: 'video/mp4',
    movieId: movieId ? movieId : undefined,
    episodeId: episodeId ? episodeId : undefined,
  });

  // Calculate the HTTP input stream URL for FFmpeg
  let inputUrl = '';
  if (R2_PUBLIC_URL) {
    inputUrl = `${R2_PUBLIC_URL}/${key.split('/').map(encodeURIComponent).join('/')}`;
  } else {
    inputUrl = `${req.protocol}://${req.get('host')}/api/stream/r2/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  // Enqueue transcoding using input URL
  transcodeQueue.enqueue(jobId, inputUrl, userName);

  res.status(201).json({
    success: true,
    data: {
      url: futurePlaylistUrl,
      jobId,
      status: 'queued',
    },
  });
});
