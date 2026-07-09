import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password';
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
            Sign In to Watch
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
                className="w-full bg-surface2 border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-muted" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-accent hover:underline font-semibold transition-all">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg pl-4 pr-10 py-2.5 text-text focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-text focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center text-sm text-muted">
            New to StreamSaga?{' '}
            <Link to="/register" className="text-accent hover:underline font-semibold transition-all">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
