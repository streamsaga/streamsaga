import { z } from 'zod';

export const createMovieSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  releaseYear: z.number().int().min(1888).max(new Date().getFullYear() + 2),
  duration: z.number().int().positive(),
  ageRating: z.string().optional(),
  genres: z.array(z.string()).optional().default([]),
  categories: z.array(z.string()).optional().default([]),
  cast: z.array(z.string()).optional().default([]),
  director: z.string().optional().default(''),
  poster: z.string().optional().default(''),
  banner: z.string().optional().default(''),
  trailerUrl: z.string().optional().default(''),
});

export const updateMovieSchema = createMovieSchema.partial();

export const movieQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  genre: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['processing', 'draft', 'published', 'failed']).optional(),
  featured: z.coerce.boolean().optional(),
  trending: z.coerce.boolean().optional(),
});
