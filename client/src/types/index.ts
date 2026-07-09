export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  myList: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  _id: string;
  name: string;
  slug: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export type ContentStatus = 'processing' | 'draft' | 'published' | 'failed';

export interface QualityVariant {
  resolution: '240p' | '360p' | '480p' | '720p' | '1080p';
  url: string;
  bitrate?: number;
}

export interface Movie {
  _id: string;
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  duration: number;
  ageRating: string;
  genres: Genre[];
  categories: Category[];
  cast: string[];
  director: string;
  poster: string;
  banner: string;
  trailerUrl?: string;
  hlsMasterPlaylistUrl?: string;
  qualities: QualityVariant[];
  status: ContentStatus;
  isFeatured: boolean;
  isTrending: boolean;
  views: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Series {
  _id: string;
  title: string;
  slug: string;
  description: string;
  releaseYear: number;
  ageRating: string;
  genres: Genre[];
  categories: Category[];
  cast: string[];
  poster: string;
  banner: string;
  trailerUrl?: string;
  totalSeasons: number;
  status: 'draft' | 'published';
  isFeatured: boolean;
  isTrending: boolean;
  views: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  _id: string;
  series: string;
  season: number;
  episodeNumber: number;
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  hlsMasterPlaylistUrl?: string;
  qualities: QualityVariant[];
  status: ContentStatus;
}

export interface Paginated<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
