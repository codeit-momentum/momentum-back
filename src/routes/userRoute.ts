import express from 'express';
import { getMyProfileController, updateMyProfileController } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET    /api/v1/users/me 내 프로필 조회 (JWT 필요)
router.get('/profile', authenticate, getMyProfileController);

// PATCH  /api/v1/users/me 내 프로필 수정 (JWT 필요)
router.patch('/profile', authenticate, updateMyProfileController);

export default router;
