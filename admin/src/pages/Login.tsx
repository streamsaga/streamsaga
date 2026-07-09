import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Invalid email or password';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Clapperboard className="text-accent" size={28} />
          <span className="font-display text-3xl font-semibold uppercase tracking-wider text-text">
            Stream<span className="text-accent">Saga</span>
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-surface p-6 shadow-panel"
        >
          <div>
            <h1 className="font-display text-lg uppercase tracking-wide text-text">Admin Console</h1>
            <p className="text-sm text-muted">Sign in with your administrator credentials.</p>
          </div>

          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@streamsaga.com"
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <p className="text-sm text-accent">{error}</p>}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center font-mono text-[11px] text-muted">
          RESTRICTED ACCESS &middot; ADMIN &amp; SUPERADMIN ONLY
        </p>
      </div>
    </div>
  );
}
