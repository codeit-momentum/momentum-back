import type { NextFunction, Request, Response } from 'express';
import { getAiRecommendation } from '../services/momentService.js';

// ──────────────────────────────────────────────
// POST /api/v1/moments/ai/:bucketID/recommendation
// GPT 추천 생성
// ──────────────────────────────────────────────
export const getAiRecommendationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { bucketID } = req.params as { bucketID: string };
    const { title, durationDays } = req.body as {
      title: string | undefined;
      durationDays: number | undefined;
    };

    // bucketID 형식 체크
    if (!bucketID || !/^[a-f\d]{24}$/i.test(bucketID)) {
      res.status(400).json({ message: '유효하지 않은 버킷 ID 형식입니다.' });
      return;
    }

    // title 체크
    if (!title || title.trim() === '') {
      res.status(400).json({ message: '버킷리스트 제목은 필수입니다.' });
      return;
    }

    if (title.trim().length > 50) {
      res.status(400).json({ message: '버킷리스트 제목은 50자 이내여야 합니다.' });
      return;
    }

    // durationDays 체크
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

    const data = await getAiRecommendation(
      bucketID,
      title.trim(),
      userID,
      durationDays,
    );

    res.status(200).json({ message: 'AI 추천 생성 성공', data });
  } catch (err) {
    next(err);
  }
};