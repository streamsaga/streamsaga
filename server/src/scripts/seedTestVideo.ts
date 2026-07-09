import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Movie } from '../models/Movie';
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

  // Find an admin user to assign as creator
  const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
  if (!admin) {
    console.error('No admin user found. Please seed an admin user first.');
    process.exit(1);
  }

  // Update existing 'fariyad' movie with test video URL
  const existingMovie = await Movie.findOne({ title: 'fariyad' });
  if (existingMovie) {
    existingMovie.hlsMasterPlaylistUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
    existingMovie.qualities = [
      { resolution: '1080p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' }
    ];
    existingMovie.poster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60';
    existingMovie.banner = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=60';
    await existingMovie.save();
    console.log('Successfully updated "fariyad" movie with public HLS stream URL and sample images!');
  } else {
    console.log('Movie "fariyad" not found. Creating a test movie with sample video...');
    await Movie.create({
      title: 'Big Buck Bunny (Test Video)',
      slug: 'big-buck-bunny-test',
      description: 'A large, lovable rabbit deals with harassing forest creatures in this classic open-source animation.',
      releaseYear: 2008,
      duration: 10,
      ageRating: 'G',
      genres: [],
      categories: [],
      cast: ['Bunny', 'Squirrel', 'Gopher'],
      director: 'Sacha Goedegebure',
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60',
      banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=60',
      hlsMasterPlaylistUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      qualities: [
        { resolution: '1080p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' }
      ],
      status: 'published',
      isFeatured: true,
      isTrending: true,
      createdBy: admin._id,
    });
    console.log('Successfully created test movie "Big Buck Bunny"!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
