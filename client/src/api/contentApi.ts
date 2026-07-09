import { api } from './axios';
import { ApiResponse, Movie, Series, Episode, Genre, Category } from '../types';

export interface ContentFilters {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  category?: string;
  featured?: boolean;
  trending?: boolean;
}

export async function fetchMovies(filters: ContentFilters = {}): Promise<{ movies: Movie[]; total: number; totalPages: number }> {
  const params = { ...filters, status: 'published' };
  const res = await api.get<ApiResponse<{ movies: Movie[]; pagination: { total: number; totalPages: number } }>>('/movies', { params });
  return {
    movies: res.data.data.movies,
    total: res.data.data.pagination.total,
    totalPages: res.data.data.pagination.totalPages,
  };
}

export async function fetchSeriesList(filters: { page?: number; limit?: number; search?: string } = {}): Promise<{ series: Series[]; total: number; totalPages: number }> {
  const params = { ...filters, status: 'published' };
  const res = await api.get<ApiResponse<{ series: Series[]; pagination: { total: number; totalPages: number } }>>('/series', { params });
  return {
    series: res.data.data.series,
    total: res.data.data.pagination.total,
    totalPages: res.data.data.pagination.totalPages,
  };
}

export async function fetchMovieBySlug(slug: string): Promise<Movie> {
  const res = await api.get<ApiResponse<{ movie: Movie }>>(`/movies/slug/${slug}`);
  return res.data.data.movie;
}

export async function fetchSeriesById(id: string): Promise<Series> {
  const res = await api.get<ApiResponse<{ series: Series }>>(`/series/${id}`);
  return res.data.data.series;
}

export async function fetchEpisodesForSeries(seriesId: string): Promise<Episode[]> {
  const res = await api.get<ApiResponse<{ episodes: Episode[] }>>(`/series/${seriesId}/episodes`);
  return res.data.data.episodes;
}

export async function fetchGenres(): Promise<Genre[]> {
  const res = await api.get<ApiResponse<{ genres: Genre[] }>>('/genres');
  return res.data.data.genres;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
  return res.data.data.categories;
}
