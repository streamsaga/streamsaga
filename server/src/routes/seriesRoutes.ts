import { Router } from 'express';
import {
  listSeries,
  getSeriesById,
  createSeries,
  updateSeries,
  deleteSeries,
  publishSeries,
  unpublishSeries,
} from '../controllers/seriesController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', listSeries);
router.get('/:id', getSeriesById);
router.post('/', requireAuth, requireAdmin, createSeries);
router.put('/:id', requireAuth, requireAdmin, updateSeries);
router.delete('/:id', requireAuth, requireAdmin, deleteSeries);
router.patch('/:id/publish', requireAuth, requireAdmin, publishSeries);
router.patch('/:id/unpublish', requireAuth, requireAdmin, unpublishSeries);

export default router;
