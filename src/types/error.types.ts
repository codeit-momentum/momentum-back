// errorMiddleware에서 처리하는 에러 객체 형태
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}
