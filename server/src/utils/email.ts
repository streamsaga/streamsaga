import nodemailer from 'nodemailer';
import logger from './logger';

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@streamsaga.com';

function isSmtpConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Shared email-sending helper                                        */
/* ------------------------------------------------------------------ */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function send(payload: EmailPayload): Promise<void> {
  if (!isSmtpConfigured()) {
    logger.info(`[DEV EMAIL] Would send "${payload.subject}" to ${payload.to}`);
    return;
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"StreamSaga" <${SMTP_FROM}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    logger.info(`Email sent to ${payload.to} — Message ID: ${info.messageId}`);
  } catch (error: any) {
    logger.error(`Failed to send email to ${payload.to}: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`[DEV EMAIL FALLBACK] Failed to send actual email, but proceeding in development mode.`);
      return;
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  Shared HTML wrapper                                                */
/* ------------------------------------------------------------------ */

function wrapHtml(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StreamSaga</title>
</head>
<body style="margin:0;padding:0;background-color:#141414;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 16px 40px;text-align:center;border-bottom:1px solid rgba(229,9,20,0.3);">
              <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:1px;">
                <span style="color:#E50914;">Stream</span><span style="color:#ffffff;">Saga</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#666;">
                This is an automated email from StreamSaga. Please do not reply.
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#555;">
                &copy; ${new Date().getFullYear()} StreamSaga. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  1. Registration OTP                                                */
/* ------------------------------------------------------------------ */

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  // Always log OTP in dev for convenience
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEVELOPMENT OTP] Verification code for ${email} is: ${otp}`);
    console.log(`\n=========================================\n[OTP] Verification code for ${email} is: ${otp}\n=========================================\n`);
  }

  if (!isSmtpConfigured()) {
    return;
  }

  const html = wrapHtml(`
    <p style="color:#e0e0e0;font-size:16px;margin:0 0 8px 0;">Hello,</p>
    <p style="color:#b0b0b0;font-size:15px;margin:0 0 24px 0;">
      Thank you for choosing StreamSaga. Use the verification code below to complete your registration:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <div style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#E50914 0%,#b20710 100%);border-radius:8px;font-size:32px;font-weight:800;letter-spacing:6px;color:#ffffff;">
        ${otp}
      </div>
    </div>
    <p style="color:#888;font-size:13px;margin:0;text-align:center;">
      This code is valid for <strong style="color:#e0e0e0;">10 minutes</strong>. If you did not request this, please ignore this email.
    </p>
  `);

  await send({ to: email, subject: 'Your StreamSaga Verification Code', html });
}

/* ------------------------------------------------------------------ */
/*  2. Password Reset OTP                                              */
/* ------------------------------------------------------------------ */

export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEVELOPMENT OTP] Password reset code for ${email} is: ${otp}`);
    console.log(`\n=========================================\n[PASSWORD RESET] Code for ${email} is: ${otp}\n=========================================\n`);
  }

  if (!isSmtpConfigured()) {
    return;
  }

  const html = wrapHtml(`
    <p style="color:#e0e0e0;font-size:16px;margin:0 0 8px 0;">Hello,</p>
    <p style="color:#b0b0b0;font-size:15px;margin:0 0 24px 0;">
      We received a request to reset your StreamSaga password. Use the code below to proceed:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <div style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#ff6b35 0%,#E50914 100%);border-radius:8px;font-size:32px;font-weight:800;letter-spacing:6px;color:#ffffff;">
        ${otp}
      </div>
    </div>
    <p style="color:#888;font-size:13px;margin:0;text-align:center;">
      This code is valid for <strong style="color:#e0e0e0;">10 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
    </p>
  `);

  await send({ to: email, subject: 'StreamSaga Password Reset Code', html });
}

/* ------------------------------------------------------------------ */
/*  3. Welcome Email                                                   */
/* ------------------------------------------------------------------ */

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const firstName = name.split(' ')[0];

  const html = wrapHtml(`
    <p style="color:#e0e0e0;font-size:20px;font-weight:600;margin:0 0 8px 0;">Welcome aboard, ${firstName}! 🎬</p>
    <p style="color:#b0b0b0;font-size:15px;margin:0 0 24px 0;">
      Your StreamSaga account has been created successfully. You now have access to our entire library of movies, series, and exclusive content.
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <div style="display:inline-block;padding:20px 32px;background:linear-gradient(135deg,rgba(229,9,20,0.15) 0%,rgba(229,9,20,0.05) 100%);border:1px solid rgba(229,9,20,0.3);border-radius:12px;">
        <p style="color:#e0e0e0;font-size:14px;margin:0 0 12px 0;font-weight:600;">Here's what you can do:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td style="color:#b0b0b0;font-size:13px;padding:4px 0;">🎥 &nbsp;Stream movies & series in HD</td></tr>
          <tr><td style="color:#b0b0b0;font-size:13px;padding:4px 0;">📋 &nbsp;Create your personal watchlist</td></tr>
          <tr><td style="color:#b0b0b0;font-size:13px;padding:4px 0;">🔔 &nbsp;Get notified about new releases</td></tr>
        </table>
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E50914 0%,#b20710 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
        Start Watching Now
      </a>
    </div>
  `);

  await send({ to: email, subject: 'Welcome to StreamSaga! 🎬', html });
}

/* ------------------------------------------------------------------ */
/*  4. New Device Login Alert                                          */
/* ------------------------------------------------------------------ */

export interface DeviceInfo {
  label: string;   // e.g. "Chrome 126 on Windows 10"
  ip: string;
  time: Date;
}

export async function sendNewDeviceLoginAlert(
  email: string,
  name: string,
  device: DeviceInfo
): Promise<void> {
  const firstName = name.split(' ')[0];
  const timeStr = device.time.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  if (!isSmtpConfigured()) {
    logger.info(`[DEV ALERT] New device login for ${email}: ${device.label} from ${device.ip}`);
    return;
  }

  const html = wrapHtml(`
    <p style="color:#e0e0e0;font-size:16px;margin:0 0 8px 0;">Hi ${firstName},</p>
    <p style="color:#b0b0b0;font-size:15px;margin:0 0 24px 0;">
      We detected a sign-in to your StreamSaga account from a new device. If this was you, no action is needed.
    </p>
    <div style="margin:0 0 24px 0;padding:20px 24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="color:#888;font-size:13px;padding:6px 0;width:100px;">Device</td>
          <td style="color:#e0e0e0;font-size:13px;padding:6px 0;font-weight:600;">${device.label}</td>
        </tr>
        <tr>
          <td style="color:#888;font-size:13px;padding:6px 0;">IP Address</td>
          <td style="color:#e0e0e0;font-size:13px;padding:6px 0;font-family:monospace;">${device.ip}</td>
        </tr>
        <tr>
          <td style="color:#888;font-size:13px;padding:6px 0;">Time</td>
          <td style="color:#e0e0e0;font-size:13px;padding:6px 0;">${timeStr}</td>
        </tr>
      </table>
    </div>
    <div style="padding:16px 20px;background:rgba(229,9,20,0.08);border:1px solid rgba(229,9,20,0.2);border-radius:8px;">
      <p style="color:#ff6b6b;font-size:13px;margin:0;font-weight:600;">
        ⚠️ Wasn't you? Change your password immediately to secure your account.
      </p>
    </div>
  `);

  await send({ to: email, subject: '🔐 New Device Sign-In on StreamSaga', html });
}
