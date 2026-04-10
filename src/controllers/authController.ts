import type { Request, Response, NextFunction } from 'express';
import { loginOrSignUp, reissueAccessToken } from '../services/authService.js';
import { REFRESH_TOKEN_MAX_AGE } from '../constants/authConstants.js';
import { CONFIG } from '../../config/config.js';

// 카카오 로그인 페이지로 리디렉션 (프론트에서 하는 작업) (테스트용)
export const redirectToKakaoLogin = (req: Request, res: Response): void => {
  // REDIRECT_URI 설정 (추후 동적으로 설정)
  const redirectUri = CONFIG.KAKAO_REDIRECT_URI;

  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?response_type=code` +
    `&client_id=${CONFIG.KAKAO_REST_API_KEY}` +
    `&redirect_uri=${redirectUri}`;

  res.redirect(kakaoAuthUrl); // 사용자 브라우저를 카카오 로그인 페이지로 리디렉션
};

// 인가 코드 콜백 처리 (프론트에서 하는 작업) (테스트용)
export const handleKakaoCallback = (req: Request, res: Response): void => {
  const { code } = req.query;

  if (!code) {
    res.status(400).json({ message: 'Authorization code not provided' });
    return;
  }

  // 받은 인가 코드를 클라이언트로 반환 (JSON 형태)
  res.json({ code: code });
};

// 인가 코드로 회원가입/로그인 처리
export const kakaoLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: '인가 코드가 전달되지 않았습니다.' });
      return;
    }

    const { accessToken, refreshToken, user, isNewUser } = await loginOrSignUp(code);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/',
    });

    res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? '회원가입이 완료되었습니다.' : '성공적으로 로그인되었습니다.',
      data: {
        accessToken,
        user: {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
          profile: user.profile,
          userCode: user.userCode,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh — 리프레시 토큰으로 액세스 토큰 재발급
export const refresh = (req: Request, res: Response): void => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
      return;
    }

    const accessToken = reissueAccessToken(refreshToken);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: '리프레시 토큰이 만료되었거나 유효하지 않습니다.' });
  }
};

// POST /api/auth/logout — 로그아웃
export const logout = (req: Request, res: Response): void => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/api/auth',
  });
  res.json({ message: '로그아웃 성공' });
};
