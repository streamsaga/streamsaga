import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/movies': 'Movies',
  '/series': 'Series',
  '/genres': 'Genres',
  '/categories': 'Categories',
  '/upload': 'Upload Center',
  '/users': 'Users',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/library': 'My Library',
};

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();

  if (user && user.role === 'user' && location.pathname !== '/library') {
    return <Navigate to="/library" replace />;
  }

  const title = useMemo(() => {
    const match = Object.keys(TITLES)
      .sort((a, b) => b.length - a.length)
      .find((path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)));
    return TITLES[match ?? '/'] ?? 'StreamSaga Admin';
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
