import express from 'express';
import { getAiRecommendationController } from '../controllers/momentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBucketIDForMoment } from '../middlewares/momentMiddleware.js';

const router = express.Router();

router.use(authenticate);

// POST /api/v1/moments/ai/:bucketID/recommendation  GPT 추천 생성
router.post('/ai/:bucketID/recommendation', validateBucketIDForMoment, getAiRecommendationController);

export default router;