import type { Request, Response, NextFunction } from 'express';
import { DEFAULT_PROFILE_IMAGE, NICKNAME_MAX_LENGTH } from '../constants/userConstants.js';
import { getMyProfile, getUserProfile, searchUserByCode, updateMyProfile } from '../services/userService.js';

// 내 프로필 조회 컨트롤러
export const getMyProfileController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userID = req.userId!;
    const data = await getMyProfile({ userID });
    res.status(200).json({ message: '내 프로필 조회 성공', data });
  } catch (err) {
    next(err);
  }
};

// 내 프로필 수정 컨트롤러 (PATCH 부분 수정)
export const updateMyProfileController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userID = req.userId!;
    const { nickname, profile, isKnocked } = req.body as {
      nickname?: unknown;
      profile?: unknown;
      isKnocked?: unknown;
    };

    // nickname 유효성 검사
    let nicknameValue: string | undefined;
    if (nickname !== undefined) {
      if (typeof nickname !== 'string' || nickname.trim() === '') {
        res.status(400).json({ message: '닉네임은 비어있지 않은 문자열이어야 합니다.' });
        return;
      }
      const trimmed = nickname.trim();
      if (trimmed.length > NICKNAME_MAX_LENGTH) {
        res.status(400).json({ message: `닉네임은 ${NICKNAME_MAX_LENGTH}자 이내여야 합니다.` });
        return;
      }
      nicknameValue = trimmed;
    }

    // profile 유효성 검사 (공란이면 기본 이미지로 대체)
    let profileValue: string | undefined;
    if (profile !== undefined) {
      if (typeof profile !== 'string') {
        res.status(400).json({ message: '프로필 이미지는 문자열이어야 합니다.' });
        return;
      }
      const trimmed = profile.trim();
      profileValue = trimmed === '' ? DEFAULT_PROFILE_IMAGE : trimmed;
    }

    // isKnocked 유효성 검사
    let isKnockedValue: boolean | undefined;
    if (isKnocked !== undefined) {
      if (typeof isKnocked !== 'boolean') {
        res.status(400).json({ message: 'isKnocked는 boolean이어야 합니다.' });
        return;
      }
      isKnockedValue = isKnocked;
    }

    if (nicknameValue === undefined && profileValue === undefined && isKnockedValue === undefined) {
      res.status(400).json({ message: '수정할 항목(nickname, profile, isKnocked) 중 하나 이상이 필요합니다.' });
      return;
    }

    const data = await updateMyProfile({
      userID,
      nickname: nicknameValue,
      profile: profileValue,
      isKnocked: isKnockedValue,
    });

    res.status(200).json({ message: '내 프로필 수정 성공', data });
  } catch (err) {
    next(err);
  }
};

// 유저코드로 사용자 검색 컨트롤러
export const searchUserByCodeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requestUserID = req.userId!;
    const { userCode } = req.query as { userCode: string };

    const data = await searchUserByCode({
      userCode: userCode.trim(),
      requestUserID,
    });

    res.status(200).json({ message: '사용자 검색 성공', data });
  } catch (err) {
    next(err);
  }
};

// 특정 유저 프로필 조회 컨트롤러
export const getUserProfileController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requestUserID = req.userId!;
    const { userID } = req.params as { userID: string };

    const data = await getUserProfile({
      userID,
      requestUserID,
    });

    res.status(200).json({ message: '사용자 프로필 조회 성공', data });
  } catch (err) {
    next(err);
  }
};
