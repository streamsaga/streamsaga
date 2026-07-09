import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadAvatar } from '../api/authApi';
import { X, Camera, User as UserIcon, Lock, Eye, EyeOff, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Password strength helpers
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair', color: '#f97316' };
  if (score <= 3) return { score, label: 'Good', color: '#eab308' };
  if (score <= 4) return { score, label: 'Strong', color: '#22c55e' };
  return { score, label: 'Very Strong', color: '#06b6d4' };
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Whether the user has chosen to change their password
  const changingPassword = newPassword.length > 0;
  const strength = getPasswordStrength(newPassword);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
      setAvatarPreview(user.avatar || '');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    // Password-change validation
    if (changingPassword) {
      if (!currentPassword) {
        toast.error('Please enter your current password to confirm the change');
        return;
      }
      if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (currentPassword === newPassword) {
        toast.error('New password must be different from your current password');
        return;
      }
    }

    setIsSaving(true);
    try {
      let uploadedAvatarUrl = user.avatar;

      // 1. Upload avatar if selected
      if (avatarFile) {
        toast.loading('Uploading avatar...', { id: 'profile-save' });
        uploadedAvatarUrl = await uploadAvatar(avatarFile);
      }

      // 2. Save profile updates
      toast.loading('Saving profile changes...', { id: 'profile-save' });
      await updateProfile({
        name: name.trim(),
        avatar: uploadedAvatarUrl,
        ...(changingPassword && {
          currentPassword,
          password: newPassword,
        }),
      });

      await refreshUser();
      toast.success('Profile updated successfully!', { id: 'profile-save' });
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      toast.error(msg, { id: 'profile-save' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputBase =
    'w-full bg-zinc-800/80 border border-zinc-700 focus:border-accent text-white rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none transition-colors placeholder:text-zinc-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transform transition-all duration-300 scale-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white tracking-wide">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[80vh]">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-24 h-24 rounded-full overflow-hidden border-2 border-accent cursor-pointer bg-zinc-800 flex items-center justify-center shadow-inner hover:brightness-95 transition-all"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-zinc-500" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <span className="text-xs text-zinc-400">Click to change photo (Max 2MB)</span>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputBase}
                  placeholder="Your Name"
                  disabled={isSaving}
                  required
                />
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* ── Password Change Section ── */}
            <div className="border border-zinc-700/60 rounded-xl p-4 space-y-4 bg-zinc-800/30">
              <div className="flex items-center gap-2 mb-1">
                {changingPassword ? (
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-zinc-500" />
                )}
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Change Password
                </span>
                {!changingPassword && (
                  <span className="ml-auto text-[10px] text-zinc-500 italic">Leave blank to keep current</span>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputBase}
                    placeholder="Enter new password"
                    disabled={isSaving}
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Current Password + Confirm — only shown when user types a new password */}
              {changingPassword && (
                <>
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Current Password <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`${inputBase} border-amber-500/40 focus:border-amber-400`}
                        placeholder="Enter your current password"
                        disabled={isSaving}
                        required={changingPassword}
                        autoComplete="current-password"
                      />
                      <Lock className="w-4 h-4 text-amber-500/60 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-amber-400/80 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Required to verify your identity before changing password
                    </p>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${inputBase} ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-red-500/60 focus:border-red-500'
                            : confirmPassword && confirmPassword === newPassword
                            ? 'border-green-500/60 focus:border-green-500'
                            : ''
                        }`}
                        placeholder="Re-enter new password"
                        disabled={isSaving}
                        required={changingPassword}
                        autoComplete="new-password"
                      />
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-1 text-[11px] text-red-400">Passwords do not match</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && (
                      <p className="mt-1 text-[11px] text-green-400">Passwords match ✓</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg hover:shadow-accent/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
