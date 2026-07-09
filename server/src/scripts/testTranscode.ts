import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';
import { transcodeToHls } from '../utils/transcoder';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function runTest() {
  const testInputPath = path.join(process.cwd(), 'temp_test_input.mp4');
  const jobId = 'test-job-id-123';
  const outputDir = path.join(process.cwd(), 'uploads', 'transcoded', jobId);

  console.log('--- STARTING HLS TRANSCODING VERIFICATION ---');

  // 1. Generate a small synthetic 3-second video file using ffmpeg
  console.log('Generating synthetic test video...');
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input('color=c=black:s=640x360:d=3')
      .inputFormat('lavfi')
      .input('sine=f=440:d=3')
      .inputFormat('lavfi')
      .outputOptions(['-c:v libx264', '-c:a aac', '-shortest'])
      .output(testInputPath)
      .on('end', () => {
        console.log('Synthetic test video generated successfully.');
        resolve();
      })
      .on('error', (err) => {
        console.error('Failed to generate synthetic video:', err.message);
        reject(err);
      })
      .run();
  });

  // 2. Transcode the generated video
  console.log('Running test video through transcoding pipeline...');
  try {
    const result = await transcodeToHls(testInputPath, jobId, (progress) => {
      console.log(`Transcode progress: ${progress.percent}% [Resolution: ${progress.currentResolution || 'Probing'}]`);
    });

    console.log('Pipeline result:', JSON.stringify(result, null, 2));

    // 3. Verify outputs
    const masterPlaylistExists = fs.existsSync(path.join(outputDir, 'master.m3u8'));
    const qualityFolder240pExists = fs.existsSync(path.join(outputDir, '240p'));
    const qualityPlaylist240pExists = fs.existsSync(path.join(outputDir, '240p', 'index.m3u8'));

    console.log('Verification checklist:');
    console.log(`- master.m3u8 exists: ${masterPlaylistExists}`);
    console.log(`- 240p folder exists: ${qualityFolder240pExists}`);
    console.log(`- 240p/index.m3u8 exists: ${qualityPlaylist240pExists}`);

    if (masterPlaylistExists && qualityFolder240pExists && qualityPlaylist240pExists) {
      console.log('SUCCESS: Transcoding verification passed!');
    } else {
      console.error('FAILURE: Missing output files.');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('FAILURE: Transcoding failed with error:', err.message);
    process.exit(1);
  } finally {
    // 4. Cleanup
    console.log('Cleaning up test files...');
    if (fs.existsSync(testInputPath)) fs.unlinkSync(testInputPath);
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    console.log('Cleanup complete.');
  }
}

runTest();
