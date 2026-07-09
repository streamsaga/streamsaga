import { Router } from 'express';
import { listGenres, createGenre, updateGenre, deleteGenre } from '../controllers/genreController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createGenreSchema } from '../validators/taxonomyValidators';

const router = Router();

router.get('/', listGenres);
router.post('/', requireAuth, requireAdmin, validate(createGenreSchema), createGenre);
router.put('/:id', requireAuth, requireAdmin, updateGenre);
router.delete('/:id', requireAuth, requireAdmin, deleteGenre);

export default router;
