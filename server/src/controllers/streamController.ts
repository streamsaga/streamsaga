import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { Readable } from 'stream';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

// Instantiate the S3 Client for Cloudflare R2
const endpoint = R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const s3Client = new S3Client({
  endpoint,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
  region: 'auto',
});

/**
 * Public proxy endpoint that streams private files from Cloudflare R2
 * and supports HTTP Range requests for seeking in MP4 videos.
 */
export const streamR2Video = asyncHandler(async (req: Request, res: Response) => {
  let key = req.params[0] || req.params['0'];
  if (!key) throw new ApiError(400, 'File key is required');

  try {
    key = decodeURIComponent(key);
  } catch (e) {
    // Fallback to raw key if URI is malformed
  }

  const range = req.headers.range;

  try {
    // 1. Fetch object metadata to get size and type
    const head = await s3Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );

    const fileSize = head.ContentLength || 0;
    const contentType = head.ContentType || 'video/mp4';

    if (range) {
      // Range header format: "bytes=start-end"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunksize = end - start + 1;

      // 2. Fetch only the requested byte range from Cloudflare R2
      const r2Stream = await s3Client.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Range: `bytes=${start}-${end}`,
        })
      );

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });

      if (r2Stream.Body) {
        (r2Stream.Body as Readable).pipe(res);
      }
    } else {
      // Direct request without range header
      const r2Stream = await s3Client.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        })
      );

      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });

      if (r2Stream.Body) {
        (r2Stream.Body as Readable).pipe(res);
      }
    }
  } catch (err: any) {
    throw new ApiError(404, `Video not found on Cloudflare R2: ${key}. Error: ${err.message}`);
  }
});
