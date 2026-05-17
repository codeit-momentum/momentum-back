import type { NextFunction, Request, Response } from 'express';
import { TERM_TYPES } from '../constants/termConstants.js';
import type { TermType } from '../types/term.types.js';

const isTermType = (value: string): value is TermType => {
  return (TERM_TYPES as readonly string[]).includes(value);
};

export const validateListTermsQuery = (req: Request, res: Response, next: NextFunction): void => {
  const rawType = req.query.type;

  if (Array.isArray(rawType)) {
    res.status(400).json({ message: 'type은 1개만 전달할 수 있습니다.' });
    return;
  }

  if (rawType !== undefined && (typeof rawType !== 'string' || !isTermType(rawType))) {
    res.status(400).json({ message: 'type은 "REQUIRED" 또는 "OPTIONAL"만 가능합니다.' });
    return;
  }

  next();
};

export const validateAgreeTermsBody = (req: Request, res: Response, next: NextFunction): void => {
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

  next();
};

export const validateGetTermParams = (req: Request, res: Response, next: NextFunction): void => {
  const rawTermID = (req.params as { termID?: string | string[] }).termID;

  if (!rawTermID) {
    res.status(400).json({ message: '약관 ID가 필요합니다.' });
    return;
  }

  if (Array.isArray(rawTermID)) {
    res.status(400).json({ message: '약관 ID는 1개만 전달할 수 있습니다.' });
    return;
  }

  next();
};
