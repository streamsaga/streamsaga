import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Movie } from '../models/Movie';
import { User } from '../models/User';
import { slugify } from '../utils/slugify';
import os from 'os';

function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  
  // First pass: prioritize physical Wi-Fi / Wireless adapters
  for (const devName in interfaces) {
    const nameLower = devName.toLowerCase();
    const isWifi = nameLower.includes('wi-fi') || nameLower.includes('wireless');
    if (!isWifi) continue;
    
    const iface = interfaces[devName];
    if (iface) {
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address;
        }
      }
    }
  }

  // Second pass: fallback to any active physical adapter
  for (const devName in interfaces) {
    const nameLower = devName.toLowerCase();
    const isVirtual = nameLower.includes('virtual') || 
                      nameLower.includes('vbox') || 
                      nameLower.includes('vmware') || 
                      nameLower.includes('wsl') || 
                      nameLower.includes('host-only') ||
                      nameLower.includes('loopback');
    if (isVirtual) continue;

    const iface = interfaces[devName];
    if (iface) {
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address;
        }
      }
    }
  }

  return 'localhost';
}

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

function cleanFileNameToTitle(fileName: string): string {
  // Remove file extension
  let baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  // Replace underscores and hyphens with spaces
  baseName = baseName.replace(/[_-]/g, ' ');
  // Title case capitalization
  return baseName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  // Connect to MongoDB
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Find an admin user to assign as creator
  const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
  if (!admin) {
    console.error('No admin user found. Please seed an admin user first.');
    process.exit(1);
  }

  // Connect to Cloudflare R2
  const endpoint = R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    console.error('R2 environment variables are missing');
    process.exit(1);
  }

  const s3Client = new S3Client({
    endpoint,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    region: 'auto',
  });

  console.log('Fetching objects from Cloudflare R2 bucket...');
  const listed = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET,
    })
  );

  if (!listed.Contents || listed.Contents.length === 0) {
    console.log('No files found in R2 bucket to import.');
    await mongoose.disconnect();
    return;
  }

  for (const obj of listed.Contents) {
    if (!obj.Key) continue;

    // We only import video files (MP4, MKV, M3U8, etc.)
    const lowerKey = obj.Key.toLowerCase();
    const isVideo = lowerKey.endsWith('.mp4') || lowerKey.endsWith('.mkv') || lowerKey.endsWith('.m3u8') || lowerKey.endsWith('.webm');
    
    if (!isVideo) {
      console.log(`Skipping non-video key: ${obj.Key}`);
      continue;
    }

    const title = cleanFileNameToTitle(obj.Key);
    const slug = slugify(title);

    // Construct URL pointing to the local proxy streaming endpoint dynamically using local IP
    const localIp = getLocalIpAddress();
    const fileUrl = `http://${localIp}:5000/api/stream/r2/${obj.Key.split('/').map(encodeURIComponent).join('/')}`;

    // Check if movie already exists
    const existing = await Movie.findOne({ $or: [{ slug }, { title }] });
    if (existing) {
      console.log(`Movie already exists: "${title}". Updating URLs...`);
      existing.hlsMasterPlaylistUrl = fileUrl;
      existing.qualities = [
        { resolution: '1080p', url: fileUrl }
      ];
      if (!existing.poster) {
        existing.poster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60';
      }
      if (!existing.banner) {
        existing.banner = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=60';
      }
      existing.status = 'published';
      await existing.save();
    } else {
      console.log(`Importing new movie from R2: "${title}"...`);
      await Movie.create({
        title,
        slug,
        description: `Imported video from Cloudflare R2 bucket. File: ${obj.Key}`,
        releaseYear: 2026,
        duration: 90, // default placeholder duration
        ageRating: 'PG-13',
        genres: [],
        categories: [],
        cast: [],
        director: 'Unknown',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60',
        banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=60',
        hlsMasterPlaylistUrl: fileUrl,
        qualities: [
          { resolution: '1080p', url: fileUrl }
        ],
        status: 'published',
        isFeatured: true,
        isTrending: true,
        createdBy: admin._id,
      });
    }
  }

  console.log('R2 file import completed successfully!');
  await mongoose.disconnect();
}

run().catch(console.error);
