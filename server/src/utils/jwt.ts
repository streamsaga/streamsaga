import jwt, { SignOptions } from 'jsonwebtoken';

export interface AccessTokenPayload {
  userId: string;
  role: 'user' | 'admin' | 'superadmin';
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  // Fail fast in any environment where secrets are missing - never fall back to a default.
  throw new Error('JWT secrets are not configured. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env');
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}
