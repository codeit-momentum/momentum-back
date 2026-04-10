import axios from 'axios';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { CONFIG } from '../../config/config.js';
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from '../constants/authConstants.js';
import type { KakaoTokenResponse, KakaoUserInfo, JwtPayload, TokenPair } from '../types/auth.types.js';

// 인가 코드로 카카오 액세스 토큰 발급 (서버 간 통신)
export async function getKakaoToken(code: string): Promise<string> {
  const params = {
    grant_type: 'authorization_code',
    client_id: CONFIG.KAKAO_REST_API_KEY,
    client_secret: CONFIG.KAKAO_CLIENT_SECRET,
    redirect_uri: CONFIG.KAKAO_REDIRECT_URI,
    code,
  };

  const { data } = await axios.post<KakaoTokenResponse>(
    'https://kauth.kakao.com/oauth/token',
    new URLSearchParams(params),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return data.access_token;
}

// 액세스 토큰으로 카카오 사용자 정보 조회
export async function getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
  const { data } = await axios.get<KakaoUserInfo>('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

// 유저 코드 생성 (#+ 대문자/숫자 4자리)
function generateUserCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '#';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 서비스 전용 JWT 토큰 쌍 생성
export function generateTokenPair(userId: string): TokenPair {
  const accessToken = jwt.sign({ userId } satisfies JwtPayload, CONFIG.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId } satisfies JwtPayload, CONFIG.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
}

// 리프레시 토큰으로 액세스 토큰 재발급
export function reissueAccessToken(refreshToken: string): string {
  const decoded = jwt.verify(refreshToken, CONFIG.JWT_REFRESH_SECRET) as JwtPayload;

  return jwt.sign({ userId: decoded.userId } satisfies JwtPayload, CONFIG.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

// 카카오 로그인/회원가입 통합 처리
export async function loginOrSignUp(code: string) {
  // 인가 코드 -> 카카오 액세스 토큰 발급
  const kakaoAccessToken = await getKakaoToken(code);

  // 카카오 액세스 토큰 -> 유저 정보 조회
  const kakaoUser = await getKakaoUserInfo(kakaoAccessToken);

  const kakaoId = String(kakaoUser.id);
  const nickname = kakaoUser.kakao_account?.profile?.nickname ?? '사용자';

  // 이메일이 없으면 카카오ID를 활용한 임시 이메일 생성 (중복 방지)
  const email = kakaoUser.kakao_account?.email ?? `${kakaoId}@kakao.com`;

  const profile = kakaoUser.kakao_account?.profile?.profile_image_url ?? '기본이미지';

  let user = await prisma.user.findUnique({ where: { id: kakaoId } });

  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        id: kakaoId,
        nickname,
        email,
        profile,
        userCode: generateUserCode(),
      },
    });
  }

  // 서비스 전용 토큰 발급
  const { accessToken, refreshToken } = generateTokenPair(user.id);

  return { accessToken, refreshToken, user, isNewUser };
}
