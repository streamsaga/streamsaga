import { Router } from 'express';
import {
  register,
  login,
  adminLogin,
  refresh,
  logout,
  me,
  sendRegisterOtp,
  sendPasswordResetOtp,
  resetPassword,
  updateProfile,
  uploadAvatar,
} from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidators';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/register/send-otp', authLimiter, sendRegisterOtp);
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/admin/login', authLimiter, validate(loginSchema), adminLogin);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), sendPasswordResetOtp);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);
router.post('/profile/avatar', requireAuth, upload.single('avatar'), uploadAvatar);

export default router;
