import type { Request, Response, NextFunction } from 'express';

export const testHelloWorld = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    console.log('작성전');
  } catch (err) {
    next(err);
  }
};
