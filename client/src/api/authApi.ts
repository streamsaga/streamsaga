import { api, setAccessToken } from './axios';
import { ApiResponse, User } from '../types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  otp: string;
}

interface AuthData {
  user: User;
  accessToken: string;
}

export async function loginUser(payload: LoginPayload): Promise<User> {
  const res = await api.post<ApiResponse<AuthData>>('/auth/login', payload);
  setAccessToken(res.data.data.accessToken);
  return res.data.data.user;
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const res = await api.post<ApiResponse<AuthData>>('/auth/register', payload);
  setAccessToken(res.data.data.accessToken);
  return res.data.data.user;
}

export async function sendOtp(email: string): Promise<void> {
  await api.post('/auth/register/send-otp', { email });
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

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(payload: any): Promise<void> {
  await api.post('/auth/reset-password', payload);
}

export async function updateProfile(payload: { name?: string; password?: string; currentPassword?: string; avatar?: string }): Promise<User> {
  const res = await api.put<ApiResponse<{ user: User }>>('/auth/profile', payload);
  return res.data.data.user;
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await api.post<ApiResponse<{ url: string }>>('/auth/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url;
}

