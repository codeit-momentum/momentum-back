import express from 'express';
import {
  kakaoLogin,
  kakaoCallback,
  refresh,
  logout,
} from '../controllers/authController.js';

const router = express.Router();

router.get('/kakao', kakaoLogin); // 카카오 로그인 페이지 리다이렉트
router.get('/kakao/callback', kakaoCallback); // 카카오 인가 코드 콜백 (로그인/회원가입)
router.post('/refresh', refresh); // accessToken 재발급
router.post('/logout', logout); // 로그아웃 (refreshToken 쿠키 삭제)

export default router;
