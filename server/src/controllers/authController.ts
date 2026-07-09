import { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateRealEmail } from '../utils/emailValidator';
import { Otp } from '../models/Otp';
import { sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail, sendNewDeviceLoginAlert } from '../utils/email';
import { generateFingerprint, getClientIp, parseDeviceLabel } from '../utils/deviceFingerprint';
import logger from '../utils/logger';
import { uploadFile } from '../utils/r2Service';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const REFRESH_COOKIE = 'streamsaga_refresh';
const MAX_KNOWN_DEVICES = 10; // Cap to avoid unbounded array growth

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

/* ------------------------------------------------------------------ */
/*  Registration OTP                                                   */
/* ------------------------------------------------------------------ */

export const sendRegisterOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email address is required');
  }

  await validateRealEmail(email);

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
    { email, purpose: 'register' },
    { otp, createdAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await sendOtpEmail(email, otp);

  res.status(200).json({ success: true, message: 'Verification code sent successfully' });
});

/* ------------------------------------------------------------------ */
/*  Register                                                           */
/* ------------------------------------------------------------------ */

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, otp } = req.body;

  if (!otp) {
    throw new ApiError(400, 'Verification code is required');
  }

  await validateRealEmail(email);

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const otpRecord = await Otp.findOne({
    email,
    otp,
    purpose: 'register',
    createdAt: { $gte: tenMinutesAgo }
  });

  if (!otpRecord) {
    throw new ApiError(400, 'Invalid or expired verification code');
  }

  await Otp.deleteOne({ _id: otpRecord._id });

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password });

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion });

  // Send welcome email (fire-and-forget, don't block registration)
  sendWelcomeEmail(email, name).catch((err) => {
    logger.error(`Failed to send welcome email to ${email}: ${err.message}`);
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.status(201).json({ success: true, data: { user, accessToken } });
});

/* ------------------------------------------------------------------ */
/*  Device detection helper                                            */
/* ------------------------------------------------------------------ */

async function handleDeviceDetection(req: Request, userId: string, email: string, name: string): Promise<void> {
  const fingerprint = generateFingerprint(req);
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || '';
  const label = parseDeviceLabel(ua);

  const user = await User.findById(userId);
  if (!user) return;

  const existingDevice = user.knownDevices.find((d) => d.fingerprint === fingerprint);

  if (existingDevice) {
    // Known device — just update lastUsed timestamp
    await User.updateOne(
      { _id: userId, 'knownDevices.fingerprint': fingerprint },
      { $set: { 'knownDevices.$.lastUsed': new Date() } }
    );
  } else {
    // New device detected
    const isFirstLogin = user.knownDevices.length === 0;

    // Add the new device
    const newDevice = { fingerprint, label, ip, lastUsed: new Date() };
    const update: any = { $push: { knownDevices: newDevice } };

    // Cap the array size: remove the oldest device if at max
    if (user.knownDevices.length >= MAX_KNOWN_DEVICES) {
      // Remove the device with the oldest lastUsed date
      const oldest = user.knownDevices.reduce((prev, curr) =>
        prev.lastUsed < curr.lastUsed ? prev : curr
      );
      await User.updateOne(
        { _id: userId },
        { $pull: { knownDevices: { fingerprint: oldest.fingerprint } } }
      );
    }

    await User.updateOne({ _id: userId }, update);

    // Don't send alert on the very first login (the user just registered)
    if (!isFirstLogin) {
      sendNewDeviceLoginAlert(email, name, { label, ip, time: new Date() }).catch((err) => {
        logger.error(`Failed to send new device alert to ${email}: ${err.message}`);
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Login                                                              */
/* ------------------------------------------------------------------ */

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion });

  // Device detection (fire-and-forget)
  handleDeviceDetection(req, user._id.toString(), user.email, user.name).catch((err) => {
    logger.error(`Device detection failed for ${email}: ${err.message}`);
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.json({ success: true, data: { user, accessToken } });
});

/* ------------------------------------------------------------------ */
/*  Admin Login                                                        */
/* ------------------------------------------------------------------ */

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion });

  // Device detection (fire-and-forget)
  handleDeviceDetection(req, user._id.toString(), user.email, user.name).catch((err) => {
    logger.error(`Device detection failed for ${email}: ${err.message}`);
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.json({ success: true, data: { user, accessToken } });
});

/* ------------------------------------------------------------------ */
/*  Forgot Password — Send Reset OTP                                   */
/* ------------------------------------------------------------------ */

export const sendPasswordResetOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Always return success to prevent email enumeration attacks
  const user = await User.findOne({ email });
  if (!user) {
    res.status(200).json({ success: true, message: 'If an account with that email exists, a reset code has been sent' });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
    { email, purpose: 'password-reset' },
    { otp, createdAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await sendPasswordResetEmail(email, otp);

  res.status(200).json({ success: true, message: 'If an account with that email exists, a reset code has been sent' });
});

/* ------------------------------------------------------------------ */
/*  Reset Password                                                     */
/* ------------------------------------------------------------------ */

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const otpRecord = await Otp.findOne({
    email,
    otp,
    purpose: 'password-reset',
    createdAt: { $gte: tenMinutesAgo }
  });

  if (!otpRecord) {
    throw new ApiError(400, 'Invalid or expired reset code');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Delete the OTP so it can't be reused
  await Otp.deleteOne({ _id: otpRecord._id });

  // Update password and invalidate all existing refresh tokens
  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();

  res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
});

/* ------------------------------------------------------------------ */
/*  Refresh Token                                                      */
/* ------------------------------------------------------------------ */

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new ApiError(401, 'Refresh token missing');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.userId);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const newRefreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion });

  res.cookie(REFRESH_COOKIE, newRefreshToken, refreshCookieOptions());
  res.json({ success: true, data: { accessToken } });
});

/* ------------------------------------------------------------------ */
/*  Logout                                                             */
/* ------------------------------------------------------------------ */

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      // Invalidate all existing refresh tokens for this user.
      await User.findByIdAndUpdate(payload.userId, { $inc: { tokenVersion: 1 } });
    } catch {
      // Token already invalid; nothing to do.
    }
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ success: true, message: 'Logged out successfully' });
});

/* ------------------------------------------------------------------ */
/*  Me (current user)                                                  */
/* ------------------------------------------------------------------ */

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.json({ success: true, data: { user } });
});

/* ------------------------------------------------------------------ */
/*  Update Profile & Upload Avatar                                      */
/* ------------------------------------------------------------------ */

export const uploadAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, 'No file was uploaded');
  }

  const originalName = file.originalname;
  const ext = path.extname(originalName);

  try {
    const remoteKey = `avatars/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const publicUrl = await uploadFile(file.path, remoteKey, file.mimetype);

    res.status(200).json({
      success: true,
      data: {
        url: publicUrl,
        originalName,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
  } catch (err: any) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new ApiError(500, `Avatar upload failed: ${err.message}`);
  }
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user!.userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, password, currentPassword, avatar } = req.body;

  if (name !== undefined) {
    user.name = name.trim();
  }

  if (avatar !== undefined) {
    user.avatar = avatar;
  }

  if (password) {
    // Require currentPassword to verify identity before changing password
    if (!currentPassword) {
      throw new ApiError(400, 'Current password is required to set a new password');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password as string);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'New password must be at least 8 characters long');
    }

    if (currentPassword === password) {
      throw new ApiError(400, 'New password must be different from the current password');
    }

    user.password = password;
  }

  await user.save();

  res.json({
    success: true,
    data: { user },
  });
});

