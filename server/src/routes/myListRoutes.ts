import { Router } from 'express';
import { getMyList, addToMyList, removeFromMyList } from '../controllers/myListController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All watchlist routes require authentication
router.use(requireAuth);

router.get('/', getMyList);
router.post('/', addToMyList);
router.delete('/:itemId', removeFromMyList);

export default router;
