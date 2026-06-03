import type { NextFunction, Request, Response } from 'express';
import { blockUser, unblockUser } from '../services/blockService.js';

// 사용자 차단
export const block = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockerID = req.userId!;
    const { userID: blockedID } = req.params as { userID: string };

    const data = await blockUser({ blockerID, blockedID });
    res.status(201).json({ message: '사용자 차단이 완료되었습니다.', data });
  } catch (err) {
    next(err);
  }
};

// 사용자 차단 해제
export const unblock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockerID = req.userId!;
    const { userID: blockedID } = req.params as { userID: string };

    const data = await unblockUser({ blockerID, blockedID });
    res.status(200).json({ message: '사용자 차단이 해제되었습니다.', data });
  } catch (err) {
    next(err);
  }
};
