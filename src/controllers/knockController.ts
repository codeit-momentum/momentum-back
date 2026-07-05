import type { NextFunction, Request, Response } from 'express';
import { knockUser } from '../services/knockService.js';

// ──────────────────────────────────────────────
// POST /api/v1/feed/knock/:followingID
// 노크하기
// ──────────────────────────────────────────────
export const knockController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const knockerID = req.userId!;
    const { followingID } = req.params as { followingID: string };

    // followingID 유효성 체크 (카카오 ID = 숫자형 문자열)
    if (!followingID || followingID.trim() === '') {
      res.status(400).json({ message: '유저 ID가 필요합니다.' });
      return;
    }

    if (!/^\d+$/.test(followingID)) {
      res.status(400).json({ message: '유효하지 않은 유저 ID 형식입니다.' });
      return;
    }

    const data = await knockUser(knockerID, followingID);

    res.status(201).json({ message: '노크를 보냈습니다.', data });
  } catch (err) {
    next(err);
  }
};