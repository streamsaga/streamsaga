import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['user', 'admin', 'superadmin']).default('user'),
});
