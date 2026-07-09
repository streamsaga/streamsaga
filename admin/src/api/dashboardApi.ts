import { api } from './axios';
import { ApiResponse, DashboardStats, Settings } from '@/types';

export async function getDashboardStats() {
  const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return res.data.data;
}

export async function getSettings() {
  const res = await api.get<ApiResponse<{ settings: Settings }>>('/settings');
  return res.data.data.settings;
}

export async function updateSettings(payload: Partial<Settings>) {
  const res = await api.put<ApiResponse<{ settings: Settings }>>('/settings', payload);
  return res.data.data.settings;
}
