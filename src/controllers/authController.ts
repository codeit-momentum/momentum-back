import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loginOrSignUp, reissueAccessToken } from '../services/authService.js';
import { CONFIG } from '../../config/config.js';
import { REFRESH_TOKEN_COOKIE_OPTIONS, DEFAULT_COOKIE_OPTIONS } from '../constants/cookieConfig.js';

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
    res.status(400).json({ message: '인가 코드가 전달되지 않았습니다.' });
    return;
  }

  res.json({ message: '인가 코드 수신 완료', data: { code } });
};

// 인가 코드로 회원가입/로그인 처리
export const kakaoLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ message: '인가 코드가 전달되지 않았습니다.' });
      return;
    }

    const { accessToken, refreshToken, user, isNewUser } = await loginOrSignUp(code);

    res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    const responseData = {
      accessToken,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        profile: user.profile,
        userCode: user.userCode,
      },
    };

    if (isNewUser) {
      res.status(201).json({
        message: '회원가입이 완료되었습니다.',
        data: responseData,
      });
    } else {
      res.status(200).json({
        message: '성공적으로 로그인되었습니다.',
        data: responseData,
      });
    }
  } catch (err) {
    if (err instanceof Error && 'code' in err) {
      res.status(400).json({ code: (err as Error & { code: string }).code, message: err.message });
    } else {
      next(err);
    }
  }
};

// 리프레시 토큰으로 액세스 토큰 재발급
export const refresh = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = reissueAccessToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    res.json({ message: '액세스 토큰 재발급 완료', data: { accessToken } });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ code: 'TOKEN_EXPIRED', message: '리프레시 토큰이 만료되었습니다.' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ code: 'INVALID_TOKEN', message: '유효하지 않은 리프레시 토큰입니다.' });
    } else {
      next(err);
    }
  }
};

// 로그아웃 (리프래시 토큰 삭제)
export const logout = (req: Request, res: Response): void => {
  if (!req.cookies?.refreshToken) {
    res.status(401).json({ code: 'NO_TOKEN', message: '이미 로그아웃된 상태입니다.' });
    return;
  }

  res.clearCookie('refreshToken', DEFAULT_COOKIE_OPTIONS);
  res.json({ message: '로그아웃 성공' });
};
