import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Movie } from '../models/Movie';
import { Series } from '../models/Series';
import { Episode } from '../models/Episode';
import { TranscodeJob } from '../models/TranscodeJob';
import { User } from '../models/User';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const movies = await Movie.find({});
  console.log('--- MOVIES ---');
  movies.forEach(m => {
    console.log({
      id: m._id,
      title: m.title,
      status: m.status,
      hlsMasterPlaylistUrl: m.hlsMasterPlaylistUrl,
      qualities: m.qualities,
      trailerUrl: m.trailerUrl,
      poster: m.poster,
      banner: m.banner
    });
  });

  const series = await Series.find({});
  console.log('--- SERIES ---');
  series.forEach(s => {
    console.log({
      id: s._id,
      title: s.title,
      status: s.status,
      poster: s.poster,
      banner: s.banner
    });
  });

  const episodes = await Episode.find({});
  console.log('--- EPISODES ---');
  episodes.forEach(e => {
    console.log({
      id: e._id,
      series: e.series,
      title: e.title,
      season: e.season,
      episodeNumber: e.episodeNumber,
      hlsMasterPlaylistUrl: e.hlsMasterPlaylistUrl,
      qualities: e.qualities
    });
  });

  const users = await User.find({});
  console.log('--- USERS ---');
  users.forEach(u => {
    console.log({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role
    });
  });

  const jobs = await TranscodeJob.find({});
  console.log('--- TRANSCODE JOBS ---');
  jobs.forEach(j => {
    console.log({
      id: j._id,
      status: j.status,
      progress: j.progress,
      hlsMasterPlaylistUrl: j.hlsMasterPlaylistUrl,
      qualities: j.qualities,
      originalName: j.originalName,
      movieId: j.movieId,
      episodeId: j.episodeId
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
