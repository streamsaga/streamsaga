import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import path from 'path';
import fs from 'fs';
import logger from './logger';
import { uploadDir, uploadFile } from './r2Service';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export interface TranscodeProgress {
  percent: number;
  currentResolution?: string;
}

export interface TranscodeResult {
  hlsMasterPlaylistUrl: string;
  qualities: Array<{
    resolution: '240p' | '360p' | '480p' | '720p' | '1080p';
    url: string;
    bitrate: number;
  }>;
  posterUrl?: string;
}

interface QualityConfig {
  resolution: '240p' | '360p' | '480p' | '720p' | '1080p';
  height: number;
  width: number;
  videoBitrate: string;
  audioBitrate: string;
  bandwidth: number; // For HLS master playlist
}

const QUALITY_PRESETS: QualityConfig[] = [
  { resolution: '240p', height: 240, width: 426, videoBitrate: '400k', audioBitrate: '64k', bandwidth: 464000 },
  { resolution: '360p', height: 360, width: 640, videoBitrate: '800k', audioBitrate: '96k', bandwidth: 896000 },
  { resolution: '480p', height: 480, width: 854, videoBitrate: '1400k', audioBitrate: '128k', bandwidth: 1528000 },
  { resolution: '720p', height: 720, width: 1280, videoBitrate: '2800k', audioBitrate: '128k', bandwidth: 2928000 },
  { resolution: '1080p', height: 1080, width: 1920, videoBitrate: '5000k', audioBitrate: '192k', bandwidth: 5192000 },
];

/**
 * Gets video metadata (height, duration) using ffprobe
 */
export function probeVideo(filePath: string): Promise<{ height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const height = videoStream?.height || 720;
      const duration = metadata.format.duration || 0;
      
      resolve({ height, duration });
    });
  });
}

/**
 * Transcodes a raw video file to HLS
 */
export async function transcodeToHls(
  inputPath: string,
  jobId: string,
  onProgress: (prog: TranscodeProgress) => void,
  subfolder?: string
): Promise<TranscodeResult> {
  const tempOutputDir = path.join(process.cwd(), 'uploads', 'temp_transcode', jobId);
  fs.mkdirSync(tempOutputDir, { recursive: true });

  try {
    logger.info(`Probing video file: ${inputPath}`);
    const { height: sourceHeight, duration } = await probeVideo(inputPath);
    logger.info(`Source height: ${sourceHeight}p, Duration: ${duration}s`);

    // Determine presets we need to transcode to
    const targetPresets = QUALITY_PRESETS.filter((preset) => preset.height <= sourceHeight);
    
    // Fallback: if video is extremely small, transcode to at least the smallest preset
    if (targetPresets.length === 0) {
      targetPresets.push(QUALITY_PRESETS[0]);
    }

    logger.info(`Target resolutions: ${targetPresets.map((p) => p.resolution).join(', ')}`);

    const qualities: TranscodeResult['qualities'] = [];

    // Transcode each preset sequentially
    for (let i = 0; i < targetPresets.length; i++) {
      const preset = targetPresets[i];
      const presetOutputDir = path.join(tempOutputDir, preset.resolution);
      fs.mkdirSync(presetOutputDir, { recursive: true });

      logger.info(`Starting transcode for ${preset.resolution}`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .videoBitrate(preset.videoBitrate)
          .audioBitrate(preset.audioBitrate)
          .size(`?x${preset.height}`) // Maintains aspect ratio, height is fixed
          .outputOptions([
            '-profile:v main',
            '-hls_time 6',
            '-hls_list_size 0',
            '-hls_playlist_type vod',
            `-hls_segment_filename ${path.join(presetOutputDir, 'segment_%03d.ts')}`,
          ])
          .output(path.join(presetOutputDir, 'index.m3u8'))
          .on('progress', (progress) => {
            // Calculate aggregate progress percentage
            const presetProgress = Math.min(progress.percent || 0, 100);
            const totalPercent = Math.round(
              (i * 100 + presetProgress) / targetPresets.length
            );
            onProgress({ percent: totalPercent, currentResolution: preset.resolution });
          })
          .on('end', () => {
            logger.info(`Completed transcode for ${preset.resolution}`);
            resolve();
          })
          .on('error', (err) => {
            logger.error(`Error transcoding ${preset.resolution}: ${err.message}`);
            reject(err);
          })
          .run();
      });
    }

    // Extract a poster frame at 5 seconds (or at the beginning if shorter)
    logger.info('Extracting poster frame from video...');
    const posterLocalPath = path.join(tempOutputDir, 'poster.jpg');
    await new Promise<void>((resolve) => {
      ffmpeg(inputPath)
        .seekInput(5)
        .outputOptions(['-vframes 1'])
        .output(posterLocalPath)
        .on('end', () => {
          logger.info('Poster frame extracted successfully');
          resolve();
        })
        .on('error', (err) => {
          logger.warn(`Failed to extract frame at 5s: ${err.message}. Retrying at 0s...`);
          ffmpeg(inputPath)
            .seekInput(0)
            .outputOptions(['-vframes 1'])
            .output(posterLocalPath)
            .on('end', () => {
              logger.info('Poster frame extracted at 0s successfully');
              resolve();
            })
            .on('error', (retryErr) => {
              logger.error(`Failed to extract frame at 0s: ${retryErr.message}`);
              resolve();
            })
            .run();
        })
        .run();
    });

    // Write Master Playlist file
    logger.info('Writing HLS master playlist...');
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';
    
    for (const preset of targetPresets) {
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${preset.bandwidth},RESOLUTION=${preset.width}x${preset.height}\n`;
      masterContent += `${preset.resolution}/index.m3u8\n`;
    }

    const masterPath = path.join(tempOutputDir, 'master.m3u8');
    fs.writeFileSync(masterPath, masterContent);

    // Upload entire directory of transcoded segments
    logger.info('Uploading transcoded files to storage...');
    const remoteBaseKey = subfolder ? `transcoded/${subfolder}/${jobId}` : `transcoded/${jobId}`;
    const uploadMap = await uploadDir(tempOutputDir, remoteBaseKey);

    // Construct resulting playlist urls
    const masterPlaylistUrl = uploadMap['master.m3u8'];
    
    for (const preset of targetPresets) {
      // Find the url of the sub-playlist
      const subPlaylistUrl = uploadMap[`${preset.resolution}/index.m3u8`].replace(/\\/g, '/');
      const numericBitrate = parseInt(preset.videoBitrate) * 1000;
      
      qualities.push({
        resolution: preset.resolution,
        url: subPlaylistUrl,
        bitrate: numericBitrate,
      });
    }

    const posterUrl = uploadMap['poster.jpg'];
    logger.info(`Transcode pipeline complete for job ${jobId}. Master URL: ${masterPlaylistUrl}, Poster: ${posterUrl || 'none'}`);

    return {
      hlsMasterPlaylistUrl: masterPlaylistUrl,
      qualities,
      posterUrl,
    };
  } finally {
    // Clean up local temp transcoding files
    try {
      if (fs.existsSync(tempOutputDir)) {
        fs.rmSync(tempOutputDir, { recursive: true, force: true });
      }
    } catch (err: any) {
      logger.error(`Failed to clean up temp transcode directory: ${tempOutputDir}. Error: ${err.message}`);
    }

    // Clean up input file if it is in the temp upload location
    try {
      if (inputPath.includes('temp') && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch (err: any) {
      // Ignore
    }
  }
}
