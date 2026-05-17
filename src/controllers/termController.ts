import type { Request, Response, NextFunction } from 'express';
import { agreeToTerms, getTermById, getTerms } from '../services/termService.js';
import type { AgreeTermsRequestBody, TermType } from '../types/term.types.js';

export const listTerms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawType = req.query.type;
    const terms = await getTerms(typeof rawType === 'string' ? { type: rawType as TermType } : {});
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
    const { termIds } = req.body as AgreeTermsRequestBody;

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
          name: ut.term.name,
          type: ut.term.type,
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
    const { termID } = req.params as { termID: string };
    const term = await getTermById(termID);
    res.status(200).json({
      message: '약관 조회 성공',
      data: { term },
    });
  } catch (err) {
    next(err);
  }
};
