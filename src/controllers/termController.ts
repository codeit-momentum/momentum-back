import type { Request, Response, NextFunction } from 'express';
import { getTermById, getTerms } from '../services/termService.js';

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

