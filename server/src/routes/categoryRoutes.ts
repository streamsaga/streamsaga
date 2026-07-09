import { Router } from 'express';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema } from '../validators/taxonomyValidators';

const router = Router();

router.get('/', listCategories);
router.post('/', requireAuth, requireAdmin, validate(createCategorySchema), createCategory);
router.put('/:id', requireAuth, requireAdmin, updateCategory);
router.delete('/:id', requireAuth, requireAdmin, deleteCategory);

export default router;
