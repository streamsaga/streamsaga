import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof Error) {
    message = err.message;
    // Mongoose duplicate key error
    if ((err as any).code === 11000) {
      statusCode = 409;
      message = 'Duplicate field value violates a unique constraint';
      details = (err as any).keyValue;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      statusCode = 400;
      details = Object.values((err as any).errors).map((e: any) => e.message);
    }
  }

  if (statusCode >= 500) {
    logger.error(err instanceof Error ? err.stack || err.message : String(err));
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
