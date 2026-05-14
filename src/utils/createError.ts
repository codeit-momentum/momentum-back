import type { CustomError } from '../types/error.types.js';

// statusCode가 부착된 Error를 생성하는 헬퍼
// errorMiddleware가 statusCode를 읽어 응답으로 매핑함
export const createError = (message: string, statusCode: number): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  return error;
};
