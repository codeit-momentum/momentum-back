import type { NextFunction, Request, Response } from 'express';
import {
    challengeBucket,
    createBucket,
    getBucketDetail,
    getBucketsByUser,
    getChallengingBucketCount,
    unChallengeBucket,
} from '../services/bucketService.js';



// 버킷 생성 컨트롤러
export const createBucketController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { title } = req.body as {
      title: string | undefined;
    };

    // title 필수 체크
    if (!title || title.trim() === '') {
      res.status(400).json({ message: '버킷리스트 제목은 필수입니다.' });
      return;
    }

    // title 길이 제한
    if (title.trim().length > 50) {
      res.status(400).json({ message: '버킷리스트 제목은 50자 이내여야 합니다.' });
      return;
    }

    const data = await createBucket({
      userID,
      title: title.trim(),
    });

    res.status(201).json({ message: '버킷리스트가 생성되었습니다.', data });
  } catch (err) {
    next(err);
  }
};


// 버킷 상세 조회 컨트롤러
export const getBucketDetailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { bucketID } = req.params as { bucketID: string };

    // bucketID 유효성 체크
    if (!bucketID || bucketID.trim() === '') {
      res.status(400).json({ message: '버킷 ID가 필요합니다.' });
      return;
    }

    // MongoDB ObjectId 형식 체크 (24자리 hex 문자열)
    if (!/^[a-f\d]{24}$/i.test(bucketID)) {
      res.status(400).json({ message: '유효하지 않은 버킷 ID 형식입니다.' });
      return;
    }

    const data = await getBucketDetail({ bucketID });
    res.status(200).json({ message: '버킷리스트 상세 조회 성공', data });
  } catch (err) {
    next(err);
  }
};



// 버킷 전체 조회 컨트롤러
export const getBucketsByUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userID } = req.params as { userID: string };
    const { status } = req.query as { status?: string };

    // userID 유효성 체크
    if (!userID || userID.trim() === '') {
      res.status(400).json({ message: '유저 ID가 필요합니다.' });
      return;
    }

    // userID 숫자 형식 체크
    if (!/^\d+$/.test(userID)) {
      res.status(400).json({ message: '유효하지 않은 유저 ID 형식입니다.' });
      return;
    }

    // status 유효성 체크
    if (status !== undefined && status !== 'completed' && status !== 'challenging') {
      res.status(400).json({
        message: 'status는 completed 또는 challenging만 가능합니다.',
      });
      return;
    }

    const data = await getBucketsByUser({ userID, status });

    // 조회 결과 없을 때 빈 배열 반환
    res.status(200).json({ message: '버킷리스트 목록 조회 성공', data });
  } catch (err) {
    next(err);
  }
};


// 진행 중인 버킷 count 컨트롤러
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



// 버킷 활성화 컨트롤러
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



// 버킷 비활성화 컨트롤러
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
