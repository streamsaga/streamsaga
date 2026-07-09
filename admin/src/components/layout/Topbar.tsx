import { useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface/60 px-6 backdrop-blur">
      <h1 className="font-display text-2xl uppercase tracking-wide text-text">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text hover:bg-surface2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 font-display text-sm text-accent">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </span>
          <span className="hidden sm:block">{user?.name}</span>
          <ChevronDown size={14} className="text-muted" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-border bg-surface2 py-1 shadow-panel">
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm text-text">{user?.email}</p>
                <p className="font-mono text-[11px] uppercase text-muted">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-accent hover:bg-surface3"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
