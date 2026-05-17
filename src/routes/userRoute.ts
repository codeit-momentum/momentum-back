import express from 'express';
import { follow, getFollowers, getFollowing, setFollowFavorite, unfollow } from '../controllers/followController.js';
import {
  getMyProfileController,
  getUserProfileController,
  searchUserByCodeController,
  updateMyProfileController,
} from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateUserCodeQuery, validateUserIDParam } from '../middlewares/userMiddleware.js';

const router = express.Router();

// GET    /api/v1/users/me 내 프로필 조회 (JWT 필요)
router.get('/me', authenticate, getMyProfileController);

// PATCH  /api/v1/users/me 내 프로필 수정 (JWT 필요)
router.patch('/me', authenticate, updateMyProfileController);

// GET    /api/v1/users/search?userCode=#AZ09 유저코드로 사용자 검색 (JWT 필요)
router.get('/search', authenticate, validateUserCodeQuery, searchUserByCodeController);

// GET    /api/v1/users/profile/:userID 특정 유저 프로필 조회 (JWT 필요)
router.get('/profile/:userID/', authenticate, validateUserIDParam, getUserProfileController);

// POST   /api/v1/users/follow/:userID 사용자 팔로우 (JWT 필요)
router.post('/follow/:userID', authenticate, validateUserIDParam, follow);

// DELETE /api/v1/users/follow/:userID 팔로우 취소 (JWT 필요)
router.delete('/follow/:userID', authenticate, validateUserIDParam, unfollow);

// PATCH  /api/v1/users/follow/favorite/:userID 팔로우 즐겨찾기 설정 (JWT 필요)
router.patch('/follow/favorite/:userID', authenticate, validateUserIDParam, setFollowFavorite);

// GET    /api/v1/users/following 팔로잉 목록 조회 (JWT 필요)
router.get('/following', authenticate, getFollowing);

// GET    /api/v1/users/followers 팔로워 목록 조회 (JWT 필요)
router.get('/followers', authenticate, getFollowers);

export default router;
