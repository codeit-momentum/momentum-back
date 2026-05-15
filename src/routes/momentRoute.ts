import express from 'express';
import {
  getAiCategoryController,
  getAiRecommendationController,
} from '../controllers/momentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBucketIDForMoment } from '../middlewares/momentMiddleware.js';

const router = express.Router();

router.use(authenticate);

// POST /api/v1/moments/ai/:bucketID/category
router.post('/ai/:bucketID/category', validateBucketIDForMoment, getAiCategoryController);

// POST /api/v1/moments/ai/:bucketID/recommendation
router.post('/ai/:bucketID/recommendation', validateBucketIDForMoment, getAiRecommendationController);

export default router;