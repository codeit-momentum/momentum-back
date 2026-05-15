import type { NextFunction, Request, Response } from 'express';
import { getAiCategory, getAiRecommendation } from '../services/momentService.js';

// ──────────────────────────────────────────────
// POST /api/v1/moments/ai/:bucketID/category
// ──────────────────────────────────────────────
export const getAiCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { bucketID } = req.params as { bucketID: string };

    const data = await getAiCategory(bucketID, userID);

    res.status(200).json({ message: 'AI 카테고리 추천 성공', data });
  } catch (err) {
    next(err);
  }
};

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