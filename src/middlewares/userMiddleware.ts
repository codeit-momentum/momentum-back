import type { NextFunction, Request, Response } from 'express';
import {
  NICKNAME_SEARCH_MAX_LENGTH,
  NICKNAME_SEARCH_MIN_LENGTH,
  USER_CODE_REGEX,
} from '../constants/userConstants.js';

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

export const validateNicknameQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { nickname } = req.query;

  if (Array.isArray(nickname)) {
    res.status(400).json({ message: 'nickname은 1개만 전달할 수 있습니다.' });
    return;
  }

  if (typeof nickname !== 'string' || nickname.trim() === '') {
    res.status(400).json({ message: 'nickname이 필요합니다.' });
    return;
  }

  const trimmed = nickname.trim();
  if (trimmed.length < NICKNAME_SEARCH_MIN_LENGTH) {
    res.status(400).json({ message: `nickname은 ${NICKNAME_SEARCH_MIN_LENGTH}자 이상이어야 합니다.` });
    return;
  }

  if (trimmed.length > NICKNAME_SEARCH_MAX_LENGTH) {
    res.status(400).json({ message: `nickname은 ${NICKNAME_SEARCH_MAX_LENGTH}자 이내여야 합니다.` });
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
