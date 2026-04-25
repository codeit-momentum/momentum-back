import type { CookieOptions } from 'express';
import { REFRESH_TOKEN_MAX_AGE } from './authConstants.js';

// 기본 쿠키 설정
export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: false, // 서버 배포시 수정 필요
  sameSite: 'lax', // None, Strict, lax
  path: '/', // 쿠키 유효 범위
} as const;

// 리프래시 토큰 전용 쿠키 설정
export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  ...DEFAULT_COOKIE_OPTIONS,
  maxAge: REFRESH_TOKEN_MAX_AGE, // 쿠키 유효 기간(ms) 설정
} as const;
