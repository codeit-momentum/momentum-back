import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// ──────────────────────────────────────────────
// momentID ObjectId 형식 체크
// ──────────────────────────────────────────────
export const validateMomentID = (
  req: Request<{ momentID: string }>,
  res: Response,
  next: NextFunction,
): void => {
  const { momentID } = req.params;

  if (!momentID || !/^[a-f\d]{24}$/i.test(momentID)) {
    res.status(400).json({ message: '유효하지 않은 모멘트 ID 형식입니다.' });
    return;
  }

  next();
};

// ──────────────────────────────────────────────
// bucketID ObjectId 형식 체크
// ──────────────────────────────────────────────
export const validateBucketIDForMoment = (
  req: Request<{ bucketID: string }>,
  res: Response,
  next: NextFunction,
): void => {
  const { bucketID } = req.params;

  if (!bucketID || !/^[a-f\d]{24}$/i.test(bucketID)) {
    res.status(400).json({ message: '유효하지 않은 버킷 ID 형식입니다.' });
    return;
  }

  next();
};

// ──────────────────────────────────────────────
// 모멘트 소유자 확인
// ──────────────────────────────────────────────
export const validateMomentOwner = async (
  req: Request<{ momentID: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { momentID } = req.params;
    const requestUserID = req.userId!;

    const moment = await prisma.moment.findUnique({
      where: { id: momentID },
      select: { id: true, userID: true },
    });

    if (!moment) {
      res.status(404).json({ message: '모멘트를 찾을 수 없습니다.' });
      return;
    }

    if (moment.userID !== requestUserID) {
      res.status(403).json({ message: '본인의 모멘트만 수정할 수 있습니다.' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};