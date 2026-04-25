import express from 'express';
import {
  kakaoLogin,
  refresh,
  logout,
  redirectToKakaoLogin,
  handleKakaoCallback,
} from '../controllers/authController.js';

const router = express.Router();

// [테스트용] 프론트엔드 작업 대행 라우트
router.get('/kakao', redirectToKakaoLogin); // 카카오 로그인 페이지로 리다이렉트
router.get('/kakao/callback', handleKakaoCallback); // 인가 코드 수신 콜백

// 서비스 인증 API
router.post('/kakao/login', kakaoLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
