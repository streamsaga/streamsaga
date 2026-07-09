import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireAdmin, getSettings);
router.put('/', requireAuth, requireAdmin, updateSettings);

export default router;
