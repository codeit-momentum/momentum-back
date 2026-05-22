import express from 'express';
import {
  confirmMomentsController,
  getAiCategoryController,
  getAiRecommendationController,
} from '../controllers/momentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBucketIDForMoment } from '../middlewares/momentMiddleware.js';

const router = express.Router();

router.use(authenticate);

// POST /api/v1/moments/ai/:bucketID/category        카테고리 추천
router.post('/ai/:bucketID/category', validateBucketIDForMoment, getAiCategoryController);

// POST /api/v1/moments/ai/:bucketID/recommendation  모멘트 추천
router.post('/ai/:bucketID/recommendation', validateBucketIDForMoment, getAiRecommendationController);

// POST /api/v1/moments/ai/:bucketID                 모멘트 확정 저장
router.post('/ai/:bucketID', validateBucketIDForMoment, confirmMomentsController);

export default router;