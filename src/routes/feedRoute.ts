import express from 'express';
import { getFollowingFeedController } from '../controllers/feedController.js';
import { knockController } from '../controllers/knockController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// GET  /api/v1/feed                       팔로잉 피드 조회
router.get('/', getFollowingFeedController);

// POST /api/v1/feed/knock/:followingID    노크하기
router.post('/knock/:followingID', knockController);

export default router;