import { api } from './axios';
import { ApiResponse, User, UserRole } from '@/types';

interface UserListData {
  users: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listUsers(params: { page?: number; limit?: number; search?: string } = {}) {
  const res = await api.get<ApiResponse<UserListData>>('/users', { params });
  return res.data.data;
}

export async function updateUserRole(id: string, role: UserRole) {
  const res = await api.patch<ApiResponse<{ user: User }>>(`/users/${id}/role`, { role });
  return res.data.data.user;
}

export async function toggleUserActive(id: string) {
  const res = await api.patch<ApiResponse<{ user: User }>>(`/users/${id}/active`);
  return res.data.data.user;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

export async function createUser(payload: CreateUserPayload) {
  const res = await api.post<ApiResponse<{ user: User }>>('/users', payload);
  return res.data.data.user;
}
