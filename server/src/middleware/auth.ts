import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: 'user' | 'admin' | 'superadmin';
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token is missing');
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Admin access required');
  }
  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Superadmin access required');
  }
  next();
}
