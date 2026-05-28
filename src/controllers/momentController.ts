import type { NextFunction, Request, Response } from 'express';
import {
  confirmMoments,
  createMoment,
  getAiRecommendation,
  startNow,
  updateStartDate
} from '../services/momentService.js';


// ──────────────────────────────────────────────
// POST /api/v1/moments/ai/:bucketID/recommendation
// ──────────────────────────────────────────────
export const getAiRecommendationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { bucketID } = req.params as { bucketID: string };
    const { durationDays } = req.body as { durationDays: number | undefined };

    if (durationDays === undefined || durationDays === null) {
      res.status(400).json({ message: '예상 소요 일수는 필수입니다.' });
      return;
    }

    if (typeof durationDays !== 'number' || !Number.isInteger(durationDays)) {
      res.status(400).json({ message: '예상 소요 일수는 정수여야 합니다.' });
      return;
    }

    if (durationDays < 1) {
      res.status(400).json({ message: '예상 소요 일수는 1일 이상이어야 합니다.' });
      return;
    }

    if (durationDays > 365) {
      res.status(400).json({ message: '예상 소요 일수는 365일 이하여야 합니다.' });
      return;
    }

    const data = await getAiRecommendation(bucketID, userID, durationDays);

    res.status(200).json({ message: 'AI 모멘트 추천 성공', data });
  } catch (err) {
    next(err);
  }
};


import { BUCKET_FREQUENCIES } from '../constants/bucketConstants.js';

// ──────────────────────────────────────────────
// POST /api/v1/moments/ai/:bucketID
// 모멘트 확정 저장
// ──────────────────────────────────────────────
export const confirmMomentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { bucketID } = req.params as { bucketID: string };
    const { frequency, startDate, moments } = req.body as {
      frequency: string | undefined;
      startDate: string | undefined;
      moments: Array<{ momentTitle: string }> | undefined;
    };


    // frequency 체크
    if (!frequency || frequency.trim() === '') {
      res.status(400).json({ message: '빈도는 필수입니다.' });
      return;
    }

    if (!BUCKET_FREQUENCIES.includes(frequency as typeof BUCKET_FREQUENCIES[number])) {
      res.status(400).json({ message: `유효하지 않은 빈도입니다. 가능한 빈도: ${BUCKET_FREQUENCIES.join(', ')}` });
      return;
    }

    // startDate 체크
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      res.status(400).json({ message: '시작 날짜 형식이 올바르지 않습니다.' });
      return;
    }

    // moments 체크
    if (!moments || !Array.isArray(moments) || moments.length === 0) {
      res.status(400).json({ message: '모멘트 목록은 필수이며 최소 1개 이상이어야 합니다.' });
      return;
    }

    for (const moment of moments) {
      if (!moment.momentTitle || moment.momentTitle.trim() === '') {
        res.status(400).json({ message: '모멘트 제목은 필수입니다.' });
        return;
      }
      if (moment.momentTitle.trim().length > 50) {
        res.status(400).json({ message: '모멘트 제목은 50자 이내여야 합니다.' });
        return;
      }
    }

    const data = await confirmMoments({
      bucketID,
      userID,
      frequency,
      startDate,
      moments,
    });

    res.status(201).json({ message: '모멘트 확정 저장 성공', data });
  } catch (err) {
    next(err);
  }
};


// ──────────────────────────────────────────────
// PATCH /api/v1/moments/ai/:bucketID/startDate
// 시작 날짜 변경
// ──────────────────────────────────────────────
export const updateStartDateController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { bucketID } = req.params as { bucketID: string };
    const { startDate } = req.body as { startDate: string | undefined };

    // startDate 체크
    if (!startDate || startDate.trim() === '') {
      res.status(400).json({ message: '시작 날짜는 필수입니다.' });
      return;
    }

    if (isNaN(new Date(startDate).getTime())) {
      res.status(400).json({ message: '시작 날짜 형식이 올바르지 않습니다.' });
      return;
    }

    const data = await updateStartDate(bucketID, userID, startDate);

    res.status(200).json({ message: '시작 날짜가 변경되었습니다.', data });
  } catch (err) {
    next(err);
  }
};


// ──────────────────────────────────────────────
// POST /api/v1/moments/:bucketID
// 수동 모멘트 생성
// ──────────────────────────────────────────────
export const createMomentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { bucketID } = req.params as { bucketID: string };
    const { frequency, startDate, moments } = req.body as {
      frequency: string | undefined;
      startDate: string | undefined;
      moments: Array<{ momentTitle: string }> | undefined;
    };


    // frequency 체크
    if (!frequency || frequency.trim() === '') {
      res.status(400).json({ message: '빈도는 필수입니다.' });
      return;
    }

    if (!BUCKET_FREQUENCIES.includes(frequency as typeof BUCKET_FREQUENCIES[number])) {
      res.status(400).json({ message: `유효하지 않은 빈도입니다. 가능한 빈도: ${BUCKET_FREQUENCIES.join(', ')}` });
      return;
    }

    // startDate 체크
    if (!startDate || startDate.trim() === '') {
      res.status(400).json({ message: '시작 날짜는 필수입니다.' });
      return;
    }

    if (isNaN(new Date(startDate).getTime())) {
      res.status(400).json({ message: '시작 날짜 형식이 올바르지 않습니다.' });
      return;
    }

    // moments 체크
    if (!moments || !Array.isArray(moments) || moments.length === 0) {
      res.status(400).json({ message: '모멘트 목록은 필수이며 최소 1개 이상이어야 합니다.' });
      return;
    }

    for (const moment of moments) {
      if (!moment.momentTitle || moment.momentTitle.trim() === '') {
        res.status(400).json({ message: '모멘트 제목은 필수입니다.' });
        return;
      }
      if (moment.momentTitle.trim().length > 50) {
        res.status(400).json({ message: '모멘트 제목은 50자 이내여야 합니다.' });
        return;
      }
    }

    const data = await createMoment({
      bucketID,
      userID,
      frequency,
      startDate,
      moments,
    });

    res.status(201).json({ message: '모멘트가 생성되었습니다.', data });
  } catch (err) {
    next(err);
  }
};


// ──────────────────────────────────────────────
// PATCH /api/v1/moments/:bucketID/start/now
// 지금 바로 시작하기
// ──────────────────────────────────────────────
export const startNowController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { bucketID } = req.params as { bucketID: string };

    const data = await startNow(bucketID, userID);

    res.status(200).json({ message: '버킷리스트가 시작되었습니다.', data });
  } catch (err) {
    next(err);
  }
};