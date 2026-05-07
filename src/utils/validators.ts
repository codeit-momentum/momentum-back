import { createError } from './createError.js';

// MongoDB ObjectId 형식 (24자리 hex 문자열)
export const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

// 형식 검사 (boolean 반환) — 컨트롤러/미들웨어에서 직접 4xx 응답할 때 사용
export function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && OBJECT_ID_REGEX.test(value);
}

// 형식 검증 실패 시 400 에러 throw — 서비스 레이어 가드용
export function assertObjectId(id: string, label = 'ID'): void {
  if (!OBJECT_ID_REGEX.test(id)) {
    throw createError(`유효하지 않은 ${label}입니다.`, 400);
  }
}
