import type { NextFunction, Request, Response } from 'express';
import { getFollowingFeed } from '../services/feedService.js';

export const getFollowingFeedController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const myUserID = req.userId!;
    const { cursor, limit, userID: targetUserID } = req.query as {
      cursor?: string;
      limit?: string;
      userID?: string;
    };

    // userID 필수 체크
    if (!targetUserID || targetUserID.trim() === '') {
      res.status(400).json({ message: '유저 ID는 필수입니다.' });
      return;
    }

    // userID 숫자 형식 체크
    if (!/^\d+$/.test(targetUserID)) {
      res.status(400).json({ message: '유효하지 않은 유저 ID 형식입니다.' });
      return;
    }

    // limit 유효성 체크 (기본값 20)
    const parsedLimit = limit ? parseInt(limit, 10) : 20;

    if (isNaN(parsedLimit) || parsedLimit < 1) {
      res.status(400).json({ message: 'limit은 1 이상의 정수여야 합니다.' });
      return;
    }

    if (parsedLimit > 50) {
      res.status(400).json({ message: 'limit은 50 이하여야 합니다.' });
      return;
    }

    const data = await getFollowingFeed(myUserID, targetUserID, parsedLimit, cursor);

    res.status(200).json({ message: '팔로잉 피드 조회 성공', data });
  } catch (err) {
    next(err);
  }
};