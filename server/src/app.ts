import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import { apiLimiter } from './middleware/rateLimiter';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

import authRoutes from './routes/authRoutes';
import movieRoutes from './routes/movieRoutes';
import seriesRoutes from './routes/seriesRoutes';
import episodeRoutes from './routes/episodeRoutes';
import genreRoutes from './routes/genreRoutes';
import categoryRoutes from './routes/categoryRoutes';
import userRoutes from './routes/userRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import settingsRoutes from './routes/settingsRoutes';
import uploadRoutes from './routes/uploadRoutes';
import myListRoutes from './routes/myListRoutes';
import streamRoutes from './routes/streamRoutes';

export function createApp(): Application {
  const app = express();

  const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean) as string[];

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    })
  );
  app.use('/api', apiLimiter);

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'StreamSaga API is running', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/series', seriesRoutes);
  app.use('/api', episodeRoutes); // exposes /series/:seriesId/episodes and /episodes/:id
  app.use('/api/genres', genreRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/my-list', myListRoutes);
  app.use('/api/stream', streamRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
