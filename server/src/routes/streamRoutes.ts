import { Router } from 'express';
import { streamR2Video } from '../controllers/streamController';

const router = Router();

// Expose public endpoint for direct range-based R2 video streaming
router.get('/r2/*', streamR2Video);

export default router;
