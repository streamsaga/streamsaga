import dns from 'dns';
import { promisify } from 'util';
import { ApiError } from './apiError';
import logger from './logger';

const resolveMx = promisify(dns.resolveMx);

// Curated blocklist of common disposable, temporary, and test email domains
const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com', 'mailinator.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'guerrillamail.com', 'guerrillamailblock.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'sharklasers.com', 'guerillamail.info', 'grr.la', 'guerrillamail.de',
  'trashmail.com', 'dispostable.com', 'maildrop.cc', 'burnermail.io', 'fakeinbox.com',
  'generator.email', 'throwawaymail.com', 'getairmail.com', 'mailnesia.com', 'mailcatch.com',
  'tempmailaddress.com', 'mintemail.com', 'mailasdf.com', 'disposable.com', 'tempmail.net',
  'mailinator2.com', 'moakt.com', 'getnada.com', 'tempmail.co', 'maildrop.org',
  'fakeinbox.info', 'fakeinbox.net', 'tempmail.us', 'temp-mail.ru', 'temp-mail.com',
  'instantemail.org', '10minutemail.co.za', '10minutemail.net', '10minutemail.org',
  'yopmail.fr', 'yopmail.net', 'yopmail.info', 'yopmail.org', 'yopmail.biz',
  'mailinator.net', 'mailinator.org', 'mailinator.info', 'mailinator.biz',
  'example.com', 'test.com', 'invalid.com', 'localhost', 'placeholder.com',
  'domain.com', 'asdf.com'
]);

/**
 * Validates that an email is not disposable, fake, or associated with a domain
 * that cannot receive mail (has no active DNS MX records).
 * 
 * @param email The email address to validate.
 * @throws ApiError if the email is invalid.
 */
export async function validateRealEmail(email: string): Promise<void> {
  if (!email || typeof email !== 'string') {
    throw new ApiError(400, 'Email address is required');
  }

  const parts = email.trim().split('@');
  if (parts.length !== 2) {
    throw new ApiError(400, 'Invalid email format');
  }

  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV] Skipping strict email validation for ${email}`);
    return;
  }

  const domain = parts[1].toLowerCase();

  // 1. Check against the static blocklist (handles exact matches and subdomains)
  const isBlocked = Array.from(DISPOSABLE_DOMAINS).some(blockedDomain => 
    domain === blockedDomain || domain.endsWith('.' + blockedDomain)
  );

  if (isBlocked) {
    throw new ApiError(400, 'Disposable, temporary, or placeholder email domains are not allowed');
  }

  // 2. Perform DNS MX record lookup
  // We wrap it in a timeout so it doesn't hang the registration request if DNS resolution is slow.
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('DNS_TIMEOUT')), 3000)
  );

  try {
    const mxRecords = await Promise.race([
      resolveMx(domain),
      timeoutPromise
    ]);

    if (!mxRecords || mxRecords.length === 0) {
      throw new ApiError(400, 'The email domain does not have valid mail server (MX) records configured');
    }
  } catch (error: any) {
    // If the error code is ENOTFOUND or ENODATA, it's definitely a non-existent or misconfigured domain.
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      throw new ApiError(400, `The email domain "${domain}" does not exist or cannot receive mail`);
    }

    // For timeouts or temporary lookup errors, fail-soft (log warning but allow the request)
    // to prevent blocking legitimate sign-ups due to network/DNS hiccups on the server.
    if (error.message === 'DNS_TIMEOUT') {
      logger.warn(`Email validation DNS MX check timed out for domain: ${domain}`);
    } else {
      logger.warn(`Email validation DNS MX check encountered error for domain: ${domain}. Error: ${error.message}`);
    }
  }
}
