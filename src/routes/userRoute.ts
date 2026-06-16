import express from 'express';
import { block, unblock } from '../controllers/blockController.js';
import { follow, getFollowers, getFollowing, setFollowFavorite, unfollow } from '../controllers/followController.js';
import { getRecommendedFriendsController } from '../controllers/recommendController.js';
import {
  getMyProfileController,
  getUserProfileController,
  searchUserByCodeController,
  searchUsersByNicknameController,
  toggleKnockPermissionController,
  updateBrowsePublicSettingController,
  updateMyNicknameController,
  updateMyProfileController,
  updateMyProfileImageController,
  updateRandomFeedSettingController,
  updateRecommendEnabledSettingController,
  updateRecommendPublicSettingController,
} from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateNicknameQuery, validateUserCodeQuery, validateUserIDParam } from '../middlewares/userMiddleware.js';

const router = express.Router();

// GET    /api/v1/users/me 내 프로필 조회 (JWT 필요)
router.get('/me', authenticate, getMyProfileController);

// PATCH  /api/v1/users/me 내 프로필 수정 (JWT 필요)
router.patch('/me', authenticate, updateMyProfileController);

// PATCH  /api/v1/users/me/profile 프로필 이미지만 수정 (JWT 필요)
router.patch('/me/profile', authenticate, updateMyProfileImageController);

// PATCH  /api/v1/users/me/nickname 닉네임만 수정 (JWT 필요)
router.patch('/me/nickname', authenticate, updateMyNicknameController);

// PATCH  /api/v1/users/me/knock 노크 허용 여부 토글 (JWT 필요)
router.patch('/me/knock', authenticate, toggleKnockPermissionController);

// PATCH  /api/v1/users/me/browse/random-feed 랜덤피드 허용 여부 수정 (JWT 필요)
router.patch('/me/browse/random-feed', authenticate, updateRandomFeedSettingController);

// PATCH  /api/v1/users/me/browse/public 둘러보기 공개 여부 수정 (JWT 필요)
router.patch('/me/browse/public', authenticate, updateBrowsePublicSettingController);

// PATCH  /api/v1/users/me/recommend/public 추천친구 공개 여부 수정 (JWT 필요)
router.patch('/me/recommend/public', authenticate, updateRecommendPublicSettingController);

// PATCH  /api/v1/users/me/recommend/algorithm 추천친구 알고리즘 허용 여부 수정 (JWT 필요)
router.patch('/me/recommend/algorithm', authenticate, updateRecommendEnabledSettingController);

// GET    /api/v1/users/recommend 추천친구 조회 (JWT 필요)
router.get('/recommend', authenticate, getRecommendedFriendsController);

// GET    /api/v1/users/search/nickname?nickname= 닉네임으로 사용자 검색 (JWT 필요)
router.get('/search/nickname', authenticate, validateNicknameQuery, searchUsersByNicknameController);

// GET    /api/v1/users/search?userCode=#AZ09 유저코드로 사용자 검색 (JWT 필요)
router.get('/search', authenticate, validateUserCodeQuery, searchUserByCodeController);

// GET    /api/v1/users/profile/:userID 특정 유저 프로필 조회 (JWT 필요)
router.get('/profile/:userID/', authenticate, validateUserIDParam, getUserProfileController);

// POST   /api/v1/users/follow/:userID 사용자 팔로우 (JWT 필요)
router.post('/follow/:userID', authenticate, validateUserIDParam, follow);

// DELETE /api/v1/users/follow/:userID 팔로우 취소 (JWT 필요)
router.delete('/follow/:userID', authenticate, validateUserIDParam, unfollow);

// POST   /api/v1/users/block/:userID 사용자 차단 (JWT 필요)
router.post('/block/:userID', authenticate, validateUserIDParam, block);

// DELETE /api/v1/users/block/:userID 사용자 차단 해제 (JWT 필요)
router.delete('/block/:userID', authenticate, validateUserIDParam, unblock);

// PATCH  /api/v1/users/follow/favorite/:userID 팔로우 즐겨찾기 설정 (JWT 필요)
router.patch('/follow/favorite/:userID', authenticate, validateUserIDParam, setFollowFavorite);

// GET    /api/v1/users/following 팔로잉 목록 조회 (JWT 필요)
router.get('/following', authenticate, getFollowing);

// GET    /api/v1/users/followers 팔로워 목록 조회 (JWT 필요)
router.get('/followers', authenticate, getFollowers);

export default router;
