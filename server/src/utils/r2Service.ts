import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import logger from './logger';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const USE_R2 = process.env.USE_R2 === 'true';

const isConfigured = USE_R2 && !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);

export let s3Client: S3Client | null = null;

if (isConfigured) {
  const endpoint = R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  s3Client = new S3Client({
    endpoint,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
    region: 'auto',
  });
  logger.info('Cloudflare R2 Storage Service initialized.');
} else {
  logger.warn('Cloudflare R2 environment variables are missing. Storage service running in Local Mode.');
}

const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

// Ensure local directories exist
fs.mkdirSync(LOCAL_UPLOAD_ROOT, { recursive: true });

function getLocalBaseUrl(): string {
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
}

export function isR2Enabled(): boolean {
  return isConfigured;
}

/**
 * Uploads a single file to R2 or copies it to local static directory
 */
export async function uploadFile(localPath: string, key: string, contentType: string): Promise<string> {
  const normalizedKey = key.replace(/\\/g, '/');

  if (isConfigured && s3Client) {
    const fileStream = fs.createReadStream(localPath);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: normalizedKey,
        Body: fileStream,
        ContentType: contentType,
      })
    );

    // Clean up local temp file after R2 upload
    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (err: any) {
      logger.error(`Failed to delete temp file: ${localPath}. Error: ${err.message}`);
    }

    // Return the URL for the R2 object
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    const encodedKey = normalizedKey.split('/').map(encodeURIComponent).join('/');
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL}/${encodedKey}`;
    }
    // Default fallback: return the server proxy URL so it works out-of-the-box without R2_PUBLIC_URL
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}/api/stream/r2/${encodedKey}`;
  } else {
    // Local mode: move or copy file to uploads/<key>
    const destPath = path.join(LOCAL_UPLOAD_ROOT, normalizedKey);
    const destDir = path.dirname(destPath);
    fs.mkdirSync(destDir, { recursive: true });

    // Copy and then unlink to handle cross-drive/partition moves
    if (localPath !== destPath) {
      fs.copyFileSync(localPath, destPath);
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        // Safe to ignore if they are same file
      }
    }

    const publicUrl = `${getLocalBaseUrl()}/uploads/${normalizedKey}`;
    return publicUrl;
  }
}

/**
 * Uploads all files inside a folder recursively
 */
export async function uploadDir(localDirPath: string, remoteBaseKey: string): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const getFiles = (dir: string): string[] => {
    const subdirs = fs.readdirSync(dir);
    const files = subdirs.map((subdir) => {
      const res = path.resolve(dir, subdir);
      return fs.statSync(res).isDirectory() ? getFiles(res) : [res];
    });
    return files.flat();
  };

  const files = getFiles(localDirPath);

  for (const file of files) {
    const relative = path.relative(localDirPath, file).replace(/\\/g, '/');
    const remoteKey = path.join(remoteBaseKey, relative).replace(/\\/g, '/');
    
    let mimeType = 'application/octet-stream';
    if (file.endsWith('.m3u8')) {
      mimeType = 'application/x-mpegURL';
    } else if (file.endsWith('.ts')) {
      mimeType = 'video/MP2T';
    } else if (file.endsWith('.mp4')) {
      mimeType = 'video/mp4';
    } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (file.endsWith('.png')) {
      mimeType = 'image/png';
    }

    const url = await uploadFile(file, remoteKey, mimeType);
    results[relative] = url;
  }

  return results;
}

/**
 * Deletes a file from R2 or local storage
 */
export async function deleteFile(key: string): Promise<void> {
  const normalizedKey = key.replace(/\\/g, '/');

  if (isConfigured && s3Client) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: normalizedKey,
        })
      );
    } catch (err: any) {
      logger.error(`Failed to delete object from R2: ${normalizedKey}. Error: ${err.message}`);
    }
  } else {
    // Local mode: delete file from disk
    const filePath = path.join(LOCAL_UPLOAD_ROOT, normalizedKey);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err: any) {
      logger.error(`Failed to delete local file: ${filePath}. Error: ${err.message}`);
    }
  }
}

/**
 * Deletes an entire directory recursively (prefix-based in R2)
 */
export async function deleteDir(baseKey: string): Promise<void> {
  const normalizedKey = baseKey.replace(/\\/g, '/');

  if (isConfigured && s3Client) {
    try {
      // List all objects under the prefix
      const listedObjects = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET,
          Prefix: normalizedKey,
        })
      );

      if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

      const deleteParams = {
        Bucket: R2_BUCKET,
        Delete: {
          Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key })),
        },
      };

      await s3Client.send(new DeleteObjectsCommand(deleteParams));

      // If truncated, call recursively
      if (listedObjects.IsTruncated) {
        await deleteDir(baseKey);
      }
    } catch (err: any) {
      logger.error(`Failed to delete R2 directory: ${normalizedKey}. Error: ${err.message}`);
    }
  } else {
    // Local mode: delete folder from disk
    const dirPath = path.join(LOCAL_UPLOAD_ROOT, normalizedKey);
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (err: any) {
      logger.error(`Failed to delete local directory: ${dirPath}. Error: ${err.message}`);
    }
  }
}
