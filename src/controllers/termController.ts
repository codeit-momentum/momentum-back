import type { Request, Response, NextFunction } from 'express';
import { agreeToTerms, getTermById, getTerms } from '../services/termService.js';

export const listTerms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawType = req.query.type;
    if (Array.isArray(rawType)) {
      res.status(400).json({ message: 'type은 1개만 전달할 수 있습니다.' });
      return;
    }

    if (rawType !== undefined && rawType !== '필수' && rawType !== '선택') {
      res.status(400).json({ message: 'type은 "필수" 또는 "선택"만 가능합니다.' });
      return;
    }

    const terms = await getTerms(rawType ? { type: rawType } : {});
    res.status(200).json({
      message: '약관 조회 성공',
      data: { terms },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/terms — 사용자 약관 동의 처리 (JWT 필요)
export const agreeTerms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { termIds } = req.body as { termIds?: unknown };

    if (!Array.isArray(termIds)) {
      res.status(400).json({ message: 'termIds는 배열로 전달해야 합니다.' });
      return;
    }

    if (termIds.length === 0) {
      res.status(400).json({ message: '동의한 약관 ID가 1개 이상 필요합니다.' });
      return;
    }

    if (!termIds.every((id): id is string => typeof id === 'string' && id.trim() !== '')) {
      res.status(400).json({ message: 'termIds는 비어있지 않은 문자열 배열이어야 합니다.' });
      return;
    }

    // 중복 제거
    const uniqueTermIds = Array.from(new Set(termIds));

    const user = await agreeToTerms(userId, uniqueTermIds);

    res.status(200).json({
      message: '약관 동의가 완료되었습니다.',
      data: {
        user: {
          id: user.id,
          isAgreed: user.isAgreed,
        },
        agreedTerms: user.userTerms.map((ut) => ({
          termID: ut.termID,
          agreedAt: ut.agreedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTerm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = (req.params as unknown as { id?: string | string[] }).id;
    if (!rawId) {
      res.status(400).json({ message: '약관 ID가 필요합니다.' });
      return;
    }

    if (Array.isArray(rawId)) {
      res.status(400).json({ message: '약관 ID는 1개만 전달할 수 있습니다.' });
      return;
    }

    const id = rawId;
    const term = await getTermById(id);
    res.status(200).json({
      message: '약관 조회 성공',
      data: { term },
    });
  } catch (err) {
    next(err);
  }
};

