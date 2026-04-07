import type { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../../config/config.js';
import { loginOrSignUp, reissueAccessToken } from '../services/authService.js';
import { REFRESH_TOKEN_MAX_AGE } from '../constants/authConstants.js';

// GET /api/auth/kakao — 카카오 로그인 페이지로 리다이렉트
export const kakaoLogin = (req: Request, res: Response): void => {
  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` + // 카카오 OAuth 인증 URL
    `?client_id=${CONFIG.KAKAO_REST_API_KEY}` + // REST API 키
    `&redirect_uri=${CONFIG.KAKAO_REDIRECT_URI}` + // 콜백 URI
    `&response_type=code`; // 인가 코드 요청

  res.redirect(kakaoAuthUrl); // 카카오 로그인 페이지로 이동
};

// GET /api/auth/kakao/callback — 카카오 인가 코드 콜백 처리
export const kakaoCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const code = req.query.code as string; // 카카오가 전달한 인가 코드
    if (!code) {
      res.status(400).json({ message: '인가 코드가 없습니다.' });
      return;
    }

    const { accessToken, refreshToken, user, isNewUser } =
      await loginOrSignUp(code); // 로그인/회원가입 처리 및 토큰 발급

    res.cookie('refreshToken', refreshToken, {
      // refreshToken을 httpOnly 쿠키에 저장
      httpOnly: true, // JS에서 접근 불가 (XSS 방지)
      secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송 (프로덕션)
      sameSite: 'strict', // CSRF 방지
      maxAge: REFRESH_TOKEN_MAX_AGE, // 쿠키 만료: 7일
      path: '/api/auth', // /api/auth 경로에서만 쿠키 전송
    });

    res.json({
      message: isNewUser ? '회원가입 성공' : '로그인 성공',
      accessToken, // 클라이언트에 accessToken 전달 (메모리/스토리지에 저장)
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        profile: user.profile,
        userCode: user.userCode,
      },
    });
  } catch (err) {
    next(err); // 에러를 Express 에러 핸들러로 전달
  }
};

// POST /api/auth/refresh — refreshToken으로 accessToken 재발급
export const refresh = (req: Request, res: Response): void => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined; // 쿠키에서 refreshToken 추출
    if (!refreshToken) {
      res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
      return;
    }

    const accessToken = reissueAccessToken(refreshToken); // refreshToken 검증 후 새 accessToken 발급
    res.json({ accessToken });
  } catch {
    res
      .status(401)
      .json({ message: '리프레시 토큰이 만료되었거나 유효하지 않습니다.' }); // 검증 실패 (만료/변조)
  }
};

// POST /api/auth/logout — refreshToken 쿠키 삭제
export const logout = (req: Request, res: Response): void => {
  res.clearCookie('refreshToken', {
    // 설정 시와 동일한 옵션으로 쿠키 삭제
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
  res.json({ message: '로그아웃 성공' });
};
