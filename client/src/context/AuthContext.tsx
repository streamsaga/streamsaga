import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { loginUser, registerUser, fetchCurrentUser, logout as logoutApi, refreshSession } from '../api/authApi';
import { registerUnauthenticatedCallback } from '../api/axios';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await fetchCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    }
  }, []);

  const handleUnauthenticated = useCallback(() => {
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Register unauthenticated response interceptor callback
    registerUnauthenticatedCallback(handleUnauthenticated);

    (async () => {
      const token = await refreshSession();
      if (token) {
        await refreshUser();
      }
      setIsLoading(false);
    })();
  }, [refreshUser, handleUnauthenticated]);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await loginUser({ email, password });
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, otp: string) => {
    const registeredUser = await registerUser({ name, email, password, otp });
    setUser(registeredUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
