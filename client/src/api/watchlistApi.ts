import { api } from './axios';
import { ApiResponse, Movie, Series } from '../types';

interface WatchlistResponse {
  movies: Movie[];
  series: Series[];
}

export async function fetchWatchlist(): Promise<WatchlistResponse> {
  const res = await api.get<ApiResponse<WatchlistResponse>>('/my-list');
  return res.data.data;
}

export async function addToWatchlist(itemId: string): Promise<string> {
  const res = await api.post<ApiResponse<any>>('/my-list', { itemId });
  return res.data.message || 'Added to watchlist';
}

export async function removeFromWatchlist(itemId: string): Promise<string> {
  const res = await api.delete<ApiResponse<any>>(`/my-list/${itemId}`);
  return res.data.message || 'Removed from watchlist';
}
