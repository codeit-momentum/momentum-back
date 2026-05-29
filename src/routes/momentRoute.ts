import express from 'express';
import {
  confirmMomentsController,
  createMomentController,
  getAiRecommendationController,
  getMomentDetailController,
  getMomentsController,
  startNowController,
  updateStartDateController,
} from '../controllers/momentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBucketIDForMoment, validateMomentID } from '../middlewares/momentMiddleware.js';

const router = express.Router();

router.use(authenticate);
// POST   /api/v1/moments/ai/:bucketID/recommendation  모멘트 추천
router.post('/ai/:bucketID/recommendation', validateBucketIDForMoment, getAiRecommendationController);

// POST   /api/v1/moments/ai/:bucketID                 AI 모멘트 확정 저장
router.post('/ai/:bucketID', validateBucketIDForMoment, confirmMomentsController);

// PATCH  /api/v1/moments/ai/:bucketID/startDate       시작 날짜 변경
router.patch('/ai/:bucketID/startDate', validateBucketIDForMoment, updateStartDateController);

// GET    /api/v1/moments/detail/:momentID             모멘트 상세 조회
router.get('/detail/:momentID', validateMomentID, getMomentDetailController);

// POST   /api/v1/moments/:bucketID                    수동 모멘트 생성
router.post('/:bucketID', validateBucketIDForMoment, createMomentController);

// PATCH  /api/v1/moments/:bucketID/start/now          지금 바로 시작하기
router.patch('/:bucketID/start/now', validateBucketIDForMoment, startNowController);

// GET    /api/v1/moments/:bucketID                    모멘트 전체 조회
router.get('/:bucketID', validateBucketIDForMoment, getMomentsController);

export default router;