import { Router } from 'express';
import {
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieById,
  getMovieBySlug,
  listMovies,
  publishMovie,
  unpublishMovie,
  toggleFeatured,
  toggleTrending,
} from '../controllers/movieController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createMovieSchema, updateMovieSchema, movieQuerySchema } from '../validators/movieValidators';

const router = Router();

// Public
router.get('/', validate(movieQuerySchema, 'query'), listMovies);
router.get('/slug/:slug', getMovieBySlug);

// Admin only
router.post('/', requireAuth, requireAdmin, validate(createMovieSchema), createMovie);
router.get('/:id', requireAuth, requireAdmin, getMovieById);
router.put('/:id', requireAuth, requireAdmin, validate(updateMovieSchema), updateMovie);
router.delete('/:id', requireAuth, requireAdmin, deleteMovie);
router.patch('/:id/publish', requireAuth, requireAdmin, publishMovie);
router.patch('/:id/unpublish', requireAuth, requireAdmin, unpublishMovie);
router.patch('/:id/featured', requireAuth, requireAdmin, toggleFeatured);
router.patch('/:id/trending', requireAuth, requireAdmin, toggleTrending);

export default router;
