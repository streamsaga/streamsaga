import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

async function run() {
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

  console.log(`Connecting to R2 endpoint: ${endpoint}`);
  console.log(`Listing objects in bucket: ${R2_BUCKET}...`);

  try {
    const listed = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
      })
    );

    console.log('--- OBJECTS FOUND ---');
    if (!listed.Contents || listed.Contents.length === 0) {
      console.log('No objects found in bucket.');
    } else {
      listed.Contents.forEach((obj) => {
        console.log(`Key: ${obj.Key} | Size: ${(obj.Size || 0) / 1024 / 1024} MB | Last Modified: ${obj.LastModified}`);
      });
    }
  } catch (err: any) {
    console.error('Error connecting to R2 bucket:', err.message);
  }
}

run().catch(console.error);
