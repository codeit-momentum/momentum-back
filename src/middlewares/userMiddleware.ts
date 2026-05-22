import type { NextFunction, Request, Response } from 'express';
import { USER_CODE_REGEX } from '../constants/userConstants.js';

export const validateUserCodeQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { userCode } = req.query;

  if (Array.isArray(userCode)) {
    res.status(400).json({ message: 'userCode는 1개만 전달할 수 있습니다.' });
    return;
  }

  if (typeof userCode !== 'string' || userCode.trim() === '') {
    res.status(400).json({ message: 'userCode가 필요합니다.' });
    return;
  }

  if (!USER_CODE_REGEX.test(userCode.trim())) {
    res.status(400).json({ message: 'userCode는 #과 대문자/숫자 4자리 형식이어야 합니다.' });
    return;
  }

  next();
};

export const validateUserIDParam = (req: Request, res: Response, next: NextFunction): void => {
  const { userID } = req.params as { userID?: string };

  if (!userID || userID.trim() === '') {
    res.status(400).json({ message: '유저 ID가 필요합니다.' });
    return;
  }

  next();
};
