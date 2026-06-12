import type { Request, Response, NextFunction } from 'express';
import { DEFAULT_PROFILE_IMAGE, NICKNAME_MAX_LENGTH } from '../constants/userConstants.js';
import {
  getMyProfile,
  getUserProfile,
  searchUserByCode,
  searchUsersByNickname,
  toggleKnockPermission,
  updateBrowsePublicSetting,
  updateMyNickname,
  updateMyProfile,
  updateMyProfileImage,
  updateRandomFeedSetting,
  updateRecommendEnabledSetting,
  updateRecommendPublicSetting,
} from '../services/userService.js';

const parseRequiredBoolean = (
  res: Response,
  value: unknown,
  fieldName: string,
): boolean | undefined => {
  if (value === undefined) {
    res.status(400).json({ message: `${fieldName}이(가) 필요합니다.` });
    return undefined;
  }
  if (typeof value !== 'boolean') {
    res.status(400).json({ message: `${fieldName}는 boolean이어야 합니다.` });
    return undefined;
  }
  return value;
};

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

// 프로필 이미지만 수정 컨트롤러
export const updateMyProfileImageController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { profile } = req.body as { profile?: unknown };

    if (profile === undefined) {
      res.status(400).json({ message: '프로필 이미지(profile)가 필요합니다.' });
      return;
    }
    if (typeof profile !== 'string') {
      res.status(400).json({ message: '프로필 이미지는 문자열이어야 합니다.' });
      return;
    }

    const trimmed = profile.trim();
    const profileValue = trimmed === '' ? DEFAULT_PROFILE_IMAGE : trimmed;

    const data = await updateMyProfileImage({ userID, profile: profileValue });
    res.status(200).json({ message: '프로필 이미지 수정 성공', data });
  } catch (err) {
    next(err);
  }
};

// 닉네임만 수정 컨트롤러
export const updateMyNicknameController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userID = req.userId!;
    const { nickname } = req.body as { nickname?: unknown };

    if (nickname === undefined) {
      res.status(400).json({ message: '닉네임(nickname)이 필요합니다.' });
      return;
    }
    if (typeof nickname !== 'string' || nickname.trim() === '') {
      res.status(400).json({ message: '닉네임은 비어있지 않은 문자열이어야 합니다.' });
      return;
    }

    const trimmed = nickname.trim();
    if (trimmed.length > NICKNAME_MAX_LENGTH) {
      res.status(400).json({ message: `닉네임은 ${NICKNAME_MAX_LENGTH}자 이내여야 합니다.` });
      return;
    }

    const data = await updateMyNickname({ userID, nickname: trimmed });
    res.status(200).json({ message: '닉네임 수정 성공', data });
  } catch (err) {
    next(err);
  }
};

// 노크 허용 여부 토글 컨트롤러
export const toggleKnockPermissionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const data = await toggleKnockPermission({ userID });
    res.status(200).json({ message: '노크 허용 여부 변경 성공', data });
  } catch (err) {
    next(err);
  }
};

// 랜덤피드 허용 여부 수정 컨트롤러
export const updateRandomFeedSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { isRandomFeed } = req.body as { isRandomFeed?: unknown };

    const isRandomFeedValue = parseRequiredBoolean(res, isRandomFeed, 'isRandomFeed');
    if (isRandomFeedValue === undefined) return;

    const data = await updateRandomFeedSetting({ userID, isRandomFeed: isRandomFeedValue });
    res.status(200).json({ message: '랜덤피드 허용 여부 변경 성공', data });
  } catch (err) {
    next(err);
  }
};

// 둘러보기 공개 여부 수정 컨트롤러
export const updateBrowsePublicSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { isPublic } = req.body as { isPublic?: unknown };

    const isPublicValue = parseRequiredBoolean(res, isPublic, 'isPublic');
    if (isPublicValue === undefined) return;

    const data = await updateBrowsePublicSetting({ userID, isPublic: isPublicValue });
    res.status(200).json({ message: '둘러보기 공개 여부 변경 성공', data });
  } catch (err) {
    next(err);
  }
};

// 추천친구 공개 여부 수정 컨트롤러
export const updateRecommendPublicSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { isRecommendPublic } = req.body as { isRecommendPublic?: unknown };

    const isRecommendPublicValue = parseRequiredBoolean(res, isRecommendPublic, 'isRecommendPublic');
    if (isRecommendPublicValue === undefined) return;

    const data = await updateRecommendPublicSetting({ userID, isRecommendPublic: isRecommendPublicValue });
    res.status(200).json({ message: '추천친구 공개 여부 변경 성공', data });
  } catch (err) {
    next(err);
  }
};

// 추천친구 알고리즘 허용 여부 수정 컨트롤러
export const updateRecommendEnabledSettingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userID = req.userId!;
    const { isRecommendEnabled } = req.body as { isRecommendEnabled?: unknown };

    const isRecommendEnabledValue = parseRequiredBoolean(res, isRecommendEnabled, 'isRecommendEnabled');
    if (isRecommendEnabledValue === undefined) return;

    const data = await updateRecommendEnabledSetting({ userID, isRecommendEnabled: isRecommendEnabledValue });
    res.status(200).json({ message: '추천친구 알고리즘 허용 여부 변경 성공', data });
  } catch (err) {
    next(err);
  }
};

// 닉네임으로 사용자 검색 컨트롤러
export const searchUsersByNicknameController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestUserID = req.userId!;
    const { nickname } = req.query as { nickname: string };

    const data = await searchUsersByNickname({
      nickname: nickname.trim(),
      requestUserID,
    });

    res.status(200).json({ message: '닉네임 검색 성공', data });
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
