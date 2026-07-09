import { api, setAccessToken } from './axios';
import { ApiResponse, User } from '@/types';

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthData {
  user: User;
  accessToken: string;
}

export async function adminLogin(payload: LoginPayload): Promise<User> {
  const res = await api.post<ApiResponse<AuthData>>('/auth/admin/login', payload);
  setAccessToken(res.data.data.accessToken);
  return res.data.data.user;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
  return res.data.data.user;
}

export async function refreshSession(): Promise<string | null> {
  try {
    const res = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    const token = res.data.data.accessToken;
    setAccessToken(token);
    return token;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
  setAccessToken(null);
}
