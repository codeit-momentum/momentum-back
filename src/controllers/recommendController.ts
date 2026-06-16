import type { NextFunction, Request, Response } from 'express';
import { getRecommendedFriends } from '../services/recommendService.js';

// 추천친구 조회 컨트롤러
export const getRecommendedFriendsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const data = await getRecommendedFriends({ userID });
    res.status(200).json({ message: '추천 친구 조회 성공', data });
  } catch (err) {
    next(err);
  }
};
