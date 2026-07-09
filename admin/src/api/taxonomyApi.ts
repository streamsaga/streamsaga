import { api } from './axios';
import { ApiResponse, Genre, Category } from '@/types';

export async function listGenres() {
  const res = await api.get<ApiResponse<{ genres: Genre[] }>>('/genres');
  return res.data.data.genres;
}

export async function createGenre(name: string) {
  const res = await api.post<ApiResponse<{ genre: Genre }>>('/genres', { name });
  return res.data.data.genre;
}

export async function updateGenre(id: string, name: string) {
  const res = await api.put<ApiResponse<{ genre: Genre }>>(`/genres/${id}`, { name });
  return res.data.data.genre;
}

export async function deleteGenre(id: string) {
  await api.delete(`/genres/${id}`);
}

export async function listCategories() {
  const res = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
  return res.data.data.categories;
}

export async function createCategory(payload: { name: string; description?: string; order?: number }) {
  const res = await api.post<ApiResponse<{ category: Category }>>('/categories', payload);
  return res.data.data.category;
}

export async function updateCategory(id: string, payload: { name?: string; description?: string; order?: number }) {
  const res = await api.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, payload);
  return res.data.data.category;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}
