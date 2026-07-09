import { Router } from 'express';
import {
  listEpisodesForSeries,
  createEpisode,
  updateEpisode,
  deleteEpisode,
} from '../controllers/episodeController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/series/:seriesId/episodes', listEpisodesForSeries);
router.post('/series/:seriesId/episodes', requireAuth, requireAdmin, createEpisode);
router.put('/episodes/:id', requireAuth, requireAdmin, updateEpisode);
router.delete('/episodes/:id', requireAuth, requireAdmin, deleteEpisode);

export default router;
