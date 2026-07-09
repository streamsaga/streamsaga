import crypto from 'crypto';
import { Request } from 'express';

/**
 * Generates a deterministic fingerprint from request headers.
 * Used to detect "new device" logins.
 */
export function generateFingerprint(req: Request): string {
  const ua = req.headers['user-agent'] || 'unknown';
  const ip = getClientIp(req);
  const raw = `${ua}::${ip}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/**
 * Extracts the client IP from the request,
 * considering common reverse-proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Parses the User-Agent string into a human-readable device label.
 * Examples: "Chrome 126 on Windows 10", "Safari on macOS", "Mobile App"
 */
export function parseDeviceLabel(ua: string | undefined): string {
  if (!ua) return 'Unknown Device';

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/([\d]+)/);
    browser = `Edge${match ? ' ' + match[1] : ''}`;
  } else if (ua.includes('OPR/') || ua.includes('Opera')) {
    const match = ua.match(/OPR\/([\d]+)/);
    browser = `Opera${match ? ' ' + match[1] : ''}`;
  } else if (ua.includes('Chrome/')) {
    const match = ua.match(/Chrome\/([\d]+)/);
    browser = `Chrome${match ? ' ' + match[1] : ''}`;
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/([\d]+)/);
    browser = `Safari${match ? ' ' + match[1] : ''}`;
  } else if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/([\d]+)/);
    browser = `Firefox${match ? ' ' + match[1] : ''}`;
  }

  // Detect OS
  if (ua.includes('Windows NT 10')) {
    os = ua.includes('Windows NT 10.0') ? 'Windows 10/11' : 'Windows 10';
  } else if (ua.includes('Windows NT')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
  } else if (ua.includes('Android')) {
    const match = ua.match(/Android ([\d.]+)/);
    os = `Android${match ? ' ' + match[1] : ''}`;
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS ([\d_]+)/);
    os = `iOS${match ? ' ' + match[1].replace(/_/g, '.') : ''}`;
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }

  return `${browser} on ${os}`;
}
