import axios from 'axios';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { CONFIG } from '../../config/config.js';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from '../constants/authConstants.js';
import type {
  KakaoTokenResponse,
  KakaoUserInfo,
  JwtPayload,
  TokenPair,
} from '../types/auth.types.js';

// 인가 코드로 카카오 액세스 토큰 발급
export async function getKakaoToken(code: string): Promise<string> {
  const params = {
    grant_type: 'authorization_code', // OAuth 인증 방식: 인가 코드
    client_id: CONFIG.KAKAO_REST_API_KEY, // 카카오 REST API 키
    client_secret: CONFIG.KAKAO_CLIENT_SECRET, // 카카오 클라이언트 시크릿
    redirect_uri: CONFIG.KAKAO_REDIRECT_URI, // 인가 코드를 받을 리다이렉트 URI
    code, // 카카오 로그인 후 전달받은 인가 코드
  };
  console.log('[카카오 토큰 요청]', {
    ...params,
    code: code.substring(0, 10) + '...', // 보안을 위해 인가 코드 일부만 로깅
  });

  try {
    const { data } = await axios.post<KakaoTokenResponse>(
      'https://kauth.kakao.com/oauth/token', // 카카오 토큰 발급 API
      new URLSearchParams(params), // x-www-form-urlencoded 형식으로 변환
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return data.access_token; // 발급받은 카카오 액세스 토큰 반환
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('[카카오 토큰 에러]', err.response?.data); // 카카오 API 에러 응답 로깅
    }
    throw err;
  }
}

// 액세스 토큰으로 카카오 사용자 정보 조회
export async function getKakaoUserInfo(
  accessToken: string,
): Promise<KakaoUserInfo> {
  const { data } = await axios.get<KakaoUserInfo>(
    'https://kapi.kakao.com/v2/user/me', // 카카오 사용자 정보 API
    { headers: { Authorization: `Bearer ${accessToken}` } }, // Bearer 토큰 인증
  );

  return data; // 카카오 사용자 정보 반환 (id, 이메일, 닉네임, 프로필 등)
}

// 유저 코드 생성 (#+ 대문자/숫자 4자리, Ex: #KY26)
function generateUserCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // 사용 가능 문자: 대문자 + 숫자
  let code = '#'; // 유저 코드 접두사
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length)); // 랜덤 4자리 생성
  }
  return code;
}

// JWT 토큰 쌍 생성 (accessToken + refreshToken)
export function generateTokenPair(userId: string): TokenPair {
  const accessToken = jwt.sign(
    { userId } satisfies JwtPayload, // 페이로드: 사용자 ID
    CONFIG.JWT_SECRET, // accessToken 서명 키
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }, // 만료: 15분
  );

  const refreshToken = jwt.sign(
    { userId } satisfies JwtPayload, // 페이로드: 사용자 ID
    CONFIG.JWT_REFRESH_SECRET, // refreshToken 서명 키 (accessToken과 분리)
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }, // 만료: 7일
  );

  return { accessToken, refreshToken };
}

// refreshToken으로 새 accessToken 재발급
export function reissueAccessToken(refreshToken: string): string {
  const decoded = jwt.verify(
    refreshToken, // 클라이언트가 전달한 refreshToken
    CONFIG.JWT_REFRESH_SECRET, // refreshToken 서명 키로 검증
  ) as JwtPayload;

  const accessToken = jwt.sign(
    { userId: decoded.userId } satisfies JwtPayload, // 검증된 userId로 새 토큰 생성
    CONFIG.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }, // 만료: 15분
  );

  return accessToken; // 새로 발급된 accessToken 반환
}

// 카카오 로그인/회원가입 처리
export async function loginOrSignUp(code: string) {
  const kakaoAccessToken = await getKakaoToken(code); // 인가 코드 → 카카오 액세스 토큰
  const kakaoUser = await getKakaoUserInfo(kakaoAccessToken); // 카카오 액세스 토큰 → 사용자 정보

  const kakaoId = String(kakaoUser.id); // 카카오 고유 ID (DB의 user.id로 사용)
  const nickname = kakaoUser.kakao_account?.profile?.nickname ?? '사용자'; // 닉네임 (없으면 기본값)
  const email = kakaoUser.kakao_account?.email ?? ''; // 이메일 (없으면 빈 문자열)
  const profile =
    kakaoUser.kakao_account?.profile?.profile_image_url ?? '기본이미지'; // 프로필 이미지 URL

  let user = await prisma.user.findUnique({ where: { id: kakaoId } }); // 기존 유저 조회

  let isNewUser = false;
  if (!user) {
    isNewUser = true; // 신규 유저 플래그
    user = await prisma.user.create({
      data: {
        id: kakaoId, // 카카오 ID를 DB ID로 사용
        nickname,
        email,
        profile,
        userCode: generateUserCode(), // 고유 유저 코드 자동 생성
      },
    });
  }

  const { accessToken, refreshToken } = generateTokenPair(user.id); // JWT 토큰 쌍 발급

  return { accessToken, refreshToken, user, isNewUser };
}
