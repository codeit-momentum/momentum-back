import type { Request, Response, NextFunction } from 'express';
import { getHelloWorld1, getHelloWorld2 } from '../services/testService.js';

export const testHelloWorld = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await getHelloWorld1();
    const message = await getHelloWorld2();

    res.status(200).json({
      success: true,
      data,
      message,
    });
  } catch (err) {
    next(err);
  }
};
