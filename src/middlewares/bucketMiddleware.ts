import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';


export const validateBucketID = (
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


export const validateBucketOwner = async (
  req: Request<{ bucketID: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { bucketID } = req.params;
    const requestUserID = req.userId!;

    const bucket = await prisma.bucket.findUnique({
      where: { id: bucketID },
      select: { id: true, userID: true },
    });

    if (!bucket) {
      res.status(404).json({ message: '버킷리스트를 찾을 수 없습니다.' });
      return;
    }

    if (bucket.userID !== requestUserID) {
      res.status(403).json({ message: '본인의 버킷리스트만 수정할 수 있습니다.' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};