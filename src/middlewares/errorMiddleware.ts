import type { NextFunction, Request, Response } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorMiddleware = (
  err: CustomError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err.statusCode) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2025') {
      res.status(404).json({ message: '리소스를 찾을 수 없습니다.' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ message: '이미 존재하는 데이터입니다.' });
      return;
    }
  }

  res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
};