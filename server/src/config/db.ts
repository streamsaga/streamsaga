import mongoose from 'mongoose';
import logger from '../utils/logger';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in the environment');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);

  logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected (will automatically reconnect on next query)');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected successfully');
  });
}
