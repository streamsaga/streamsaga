import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/authApi';
import { Play, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setIsOtpSent(true);
      toast.success('If an account exists, a verification code was sent!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send verification code';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email address is required');
      return;
    }

    if (!isOtpSent) {
      await handleSendOtp();
      return;
    }

    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ email, otp, newPassword });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg px-4 py-12 overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-2 mb-8 select-none">
          <div className="bg-accent text-white p-2 rounded-lg flex items-center justify-center animate-pulse">
            <Play className="w-6 h-6 fill-white" />
          </div>
          <span className="text-3xl font-extrabold tracking-wider text-accent uppercase font-display">
            Stream<span className="text-white">Saga</span>
          </span>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-text mb-6">
            Reset Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isOtpSent || isSubmitting}
                className="w-full bg-surface2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50 disabled:opacity-50"
                placeholder="you@example.com"
                required
              />
            </div>

            {isOtpSent && (
              <>
                <div className="space-y-1.5 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-muted" htmlFor="otp">
                      Verification Code (OTP)
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSubmitting}
                      className="text-xs text-accent hover:underline focus:outline-none disabled:opacity-50 font-semibold"
                    >
                      Resend Code
                    </button>
                  </div>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-surface2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-accent tracking-widest text-center text-lg font-bold transition-colors placeholder:text-muted/30 placeholder:tracking-normal placeholder:font-normal"
                    placeholder="123456"
                    required
                  />
                </div>

                 <div>
                  <label className="block text-sm font-medium text-muted mb-1.5" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-surface2 border border-border rounded-lg pl-4 pr-10 py-2.5 text-text focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50 disabled:opacity-50"
                      placeholder="At least 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-text focus:outline-none disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-surface2 border border-border rounded-lg pl-4 pr-10 py-2.5 text-text focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50 disabled:opacity-50"
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isSubmitting}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-text focus:outline-none disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting
                  ? isOtpSent
                    ? 'Resetting Password...'
                    : 'Sending Code...'
                  : isOtpSent
                  ? 'Reset Password'
                  : 'Send Verification Code'}
              </button>

              {isOtpSent && (
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent hover:bg-surface2 border border-border text-muted hover:text-text font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
                >
                  Back to Email
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center text-sm">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-muted hover:text-accent font-semibold transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
