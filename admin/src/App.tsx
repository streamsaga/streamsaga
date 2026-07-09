import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Movies from '@/pages/Movies';
import Series from '@/pages/Series';
import Genres from '@/pages/Genres';
import Categories from '@/pages/Categories';
import UploadCenter from '@/pages/UploadCenter';
import Users from '@/pages/Users';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import Library from '@/pages/Library';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1C2027', color: '#E8EAED', border: '1px solid #262B33', fontSize: '13px' },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/series" element={<Series />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/upload" element={<UploadCenter />} />
                <Route path="/users" element={<Users />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/library" element={<Library />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
