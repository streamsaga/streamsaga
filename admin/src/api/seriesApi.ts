import { api } from './axios';
import { ApiResponse, Series, Episode } from '@/types';

interface SeriesListData {
  series: Series[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listSeries(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const res = await api.get<ApiResponse<SeriesListData>>('/series', { params });
  return res.data.data;
}

export async function getSeries(id: string) {
  const res = await api.get<ApiResponse<{ series: Series }>>(`/series/${id}`);
  return res.data.data.series;
}

export interface SeriesPayload {
  title: string;
  description: string;
  releaseYear: number;
  ageRating?: string;
  genres?: string[];
  categories?: string[];
  cast?: string[];
  poster?: string;
  banner?: string;
  trailerUrl?: string;
  totalSeasons?: number;
}

export async function createSeries(payload: SeriesPayload) {
  const res = await api.post<ApiResponse<{ series: Series }>>('/series', payload);
  return res.data.data.series;
}

export async function updateSeries(id: string, payload: Partial<SeriesPayload>) {
  const res = await api.put<ApiResponse<{ series: Series }>>(`/series/${id}`, payload);
  return res.data.data.series;
}

export async function deleteSeries(id: string) {
  await api.delete(`/series/${id}`);
}

export async function publishSeries(id: string) {
  const res = await api.patch<ApiResponse<{ series: Series }>>(`/series/${id}/publish`);
  return res.data.data.series;
}

export async function unpublishSeries(id: string) {
  const res = await api.patch<ApiResponse<{ series: Series }>>(`/series/${id}/unpublish`);
  return res.data.data.series;
}

export async function listEpisodes(seriesId: string) {
  const res = await api.get<ApiResponse<{ episodes: Episode[] }>>(`/series/${seriesId}/episodes`);
  return res.data.data.episodes;
}

export interface EpisodePayload {
  season: number;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  hlsMasterPlaylistUrl?: string;
}

export async function createEpisode(seriesId: string, payload: EpisodePayload) {
  const res = await api.post<ApiResponse<{ episode: Episode }>>(`/series/${seriesId}/episodes`, payload);
  return res.data.data.episode;
}

export async function updateEpisode(id: string, payload: Partial<EpisodePayload>) {
  const res = await api.put<ApiResponse<{ episode: Episode }>>(`/episodes/${id}`, payload);
  return res.data.data.episode;
}

export async function deleteEpisode(id: string) {
  await api.delete(`/episodes/${id}`);
}
