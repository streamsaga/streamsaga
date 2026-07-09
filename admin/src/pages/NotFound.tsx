import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 bg-bg text-center">
      <p className="font-mono text-sm text-accent">ERROR 404</p>
      <h1 className="font-display text-4xl uppercase tracking-wide text-text">Signal Lost</h1>
      <p className="max-w-sm text-sm text-muted">This page doesn't exist in the admin console.</p>
      <Link to="/" className="mt-4 rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover">
        Back to Dashboard
      </Link>
    </div>
  );
}
