import type { NextFunction, Request, Response } from 'express';
import {
    challengeBucket,
    createBucket,
    getBucketDetail,
    getBucketsByUser,
    getChallengingBucketCount,
    successBucket,
    unChallengeBucket,
} from '../services/bucketService.js';

export const createBucketController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { title, category, startDate, endDate } = req.body as {
      title: string;
      category?: string[];
      startDate?: string;
      endDate?: string;
    };

    if (!title || title.trim() === '') {
      res.status(400).json({ message: '버킷리스트 제목은 필수입니다.' });
      return;
    }

    const data = await createBucket({
      userID,
      title: title.trim(),
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    res.status(201).json({ message: '버킷리스트가 생성되었습니다.', data });
  } catch (err) {
    next(err);
  }
};

export const getBucketDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { bucketID } = req.params as { bucketID: string };
    const data = await getBucketDetail({ bucketID });
    res.status(200).json({ message: '버킷리스트 상세 조회 성공', data });
  } catch (err) {
    next(err);
  }
};

export const getBucketsByUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userID } = req.params as { userID: string };
    const data = await getBucketsByUser({ userID });
    res.status(200).json({ message: '버킷리스트 목록 조회 성공', data });
  } catch (err) {
    next(err);
  }
};

export const successBucketController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { bucketID } = req.params as { bucketID: string };
    const requestUserID = req.userId!;
    const data = await successBucket({ bucketID, requestUserID });
    res.status(200).json({ message: '버킷리스트를 달성하였습니다.', data });
  } catch (err) {
    next(err);
  }
};

export const challengeBucketController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { bucketID } = req.params as { bucketID: string };
    const requestUserID = req.userId!;
    const data = await challengeBucket({ bucketID, requestUserID });
    res.status(200).json({ message: '버킷리스트를 활성화하였습니다.', data });
  } catch (err) {
    next(err);
  }
};

export const unChallengeBucketController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { bucketID } = req.params as { bucketID: string };
    const requestUserID = req.userId!;
    const data = await unChallengeBucket({ bucketID, requestUserID });
    res.status(200).json({ message: '버킷리스트를 비활성화하였습니다.', data });
  } catch (err) {
    next(err);
  }
};

export const getChallengingBucketCountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userID } = req.params as { userID: string };
    const data = await getChallengingBucketCount({ userID });
    res.status(200).json({ message: '진행 중인 버킷리스트 개수 조회 성공', data });
  } catch (err) {
    next(err);
  }
};