import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Tv,
  Tags,
  FolderKanban,
  Users,
  BarChart3,
  Settings,
  UploadCloud,
  Clapperboard,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ADMIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/series', label: 'Series', icon: Tv },
  { to: '/genres', label: 'Genres', icon: Tags },
  { to: '/categories', label: 'Categories', icon: FolderKanban },
  { to: '/upload', label: 'Upload Center', icon: UploadCloud },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const USER_NAV = [
  { to: '/library', label: 'My Videos', icon: Film, end: true },
];

export default function Sidebar() {
  const { user } = useAuth();
  const navItems = user?.role === 'user' ? USER_NAV : ADMIN_NAV;

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <Clapperboard className="text-accent" size={22} />
        <span className="font-display text-xl font-semibold uppercase tracking-wider text-text">
          Stream<span className="text-accent">Saga</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 font-display text-[15px] uppercase tracking-wide transition-colors ${
                isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface2 hover:text-text'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-5 py-4 font-mono text-[11px] text-muted">
        {user?.role === 'user' ? 'USER PORTAL' : 'ADMIN CONSOLE'} &middot; v1.0
      </div>
    </aside>
  );
}
