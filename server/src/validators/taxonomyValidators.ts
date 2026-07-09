import { z } from 'zod';

export const createGenreSchema = z.object({
  name: z.string().min(1).max(60),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().optional().default(''),
  order: z.number().int().optional().default(0),
});
