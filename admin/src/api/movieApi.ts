import { api } from './axios';
import { ApiResponse, Movie, ContentStatus } from '@/types';

export interface MovieListParams {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  category?: string;
  status?: ContentStatus;
}

interface MovieListData {
  movies: Movie[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listMovies(params: MovieListParams = {}) {
  const res = await api.get<ApiResponse<MovieListData>>('/movies', { params });
  return res.data.data;
}

export async function getMovie(id: string) {
  const res = await api.get<ApiResponse<{ movie: Movie }>>(`/movies/${id}`);
  return res.data.data.movie;
}

export interface MoviePayload {
  title: string;
  description: string;
  releaseYear: number;
  duration: number;
  ageRating?: string;
  genres?: string[];
  categories?: string[];
  cast?: string[];
  director?: string;
  poster?: string;
  banner?: string;
  trailerUrl?: string;
  hlsMasterPlaylistUrl?: string;
}

export async function createMovie(payload: MoviePayload) {
  const res = await api.post<ApiResponse<{ movie: Movie }>>('/movies', payload);
  return res.data.data.movie;
}

export async function updateMovie(id: string, payload: Partial<MoviePayload>) {
  const res = await api.put<ApiResponse<{ movie: Movie }>>(`/movies/${id}`, payload);
  return res.data.data.movie;
}

export async function deleteMovie(id: string) {
  await api.delete(`/movies/${id}`);
}

export async function publishMovie(id: string) {
  const res = await api.patch<ApiResponse<{ movie: Movie }>>(`/movies/${id}/publish`);
  return res.data.data.movie;
}

export async function unpublishMovie(id: string) {
  const res = await api.patch<ApiResponse<{ movie: Movie }>>(`/movies/${id}/unpublish`);
  return res.data.data.movie;
}

export async function toggleFeatured(id: string) {
  const res = await api.patch<ApiResponse<{ movie: Movie }>>(`/movies/${id}/featured`);
  return res.data.data.movie;
}

export async function toggleTrending(id: string) {
  const res = await api.patch<ApiResponse<{ movie: Movie }>>(`/movies/${id}/trending`);
  return res.data.data.movie;
}
