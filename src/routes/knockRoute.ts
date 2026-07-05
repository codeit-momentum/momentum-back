import express from 'express';
import { knockController } from '../controllers/knockController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// POST /api/v1/feed/knock/:followingID  노크하기
router.post('/knock/:followingID', knockController);

export default router;