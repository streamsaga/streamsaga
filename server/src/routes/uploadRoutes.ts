import { Router } from 'express';
import { upload } from '../middleware/upload';
import { uploadAsset, getTranscodeStatus, getPresignedUrl, transcodeR2Video } from '../controllers/uploadController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireAdmin);

router.post('/poster', upload.single('poster'), uploadAsset);
router.post('/banner', upload.single('banner'), uploadAsset);
router.post('/trailer', upload.single('trailer'), uploadAsset);
router.post('/video', upload.single('video'), uploadAsset);

router.get('/presigned-url', getPresignedUrl);
router.post('/transcode-r2', transcodeR2Video);

router.get('/jobs/:jobId', getTranscodeStatus);

export default router;
