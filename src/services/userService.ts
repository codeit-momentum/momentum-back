import { prisma } from '../lib/prisma.js';
import {
  type GetUserProfileParams,
  USER_PROFILE_SELECT,
  USER_PUBLIC_PROFILE_SELECT,
  type GetMyProfileParams,
  type SearchUserByCodeParams,
  type ToggleKnockPermissionParams,
  type UpdateBrowsePublicSettingParams,
  type UpdateMyNicknameParams,
  type UpdateMyProfileImageParams,
  type UpdateMyProfileParams,
  type UpdateRandomFeedSettingParams,
  type UpdateRecommendEnabledSettingParams,
  type UpdateRecommendPublicSettingParams,
} from '../types/user.types.js';
import { createError } from '../utils/createError.js';

const BROWSE_DEPENDENT_RESET = {
  isPublic: false,
  isRecommendPublic: false,
  isRecommendEnabled: false,
} as const;

const assertRandomFeedEnabled = (isRandomFeed: boolean) => {
  if (!isRandomFeed) {
    throw createError('랜덤피드 허용이 켜져 있어야 이 설정을 변경할 수 있습니다.', 400);
  }
};

// 내 프로필 조회
export const getMyProfile = async (params: GetMyProfileParams) => {
  const { userID } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: USER_PROFILE_SELECT,
  });

  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);

  return user;
};

// 내 프로필 수정 (부분 수정)
export const updateMyProfile = async (params: UpdateMyProfileParams) => {
  const { userID, nickname, profile, isKnocked } = params;

  const data: { nickname?: string; profile?: string; isKnocked?: boolean } = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (profile !== undefined) data.profile = profile;
  if (isKnocked !== undefined) data.isKnocked = isKnocked;

  if (Object.keys(data).length === 0) {
    throw createError('수정할 항목이 없습니다.', 400);
  }

  const exists = await prisma.user.findUnique({ where: { id: userID }, select: { id: true } });
  if (!exists) throw createError('사용자를 찾을 수 없습니다.', 404);

  return prisma.user.update({
    where: { id: userID },
    data,
    select: USER_PROFILE_SELECT,
  });
};

// 프로필 이미지만 수정
export const updateMyProfileImage = async (params: UpdateMyProfileImageParams) => {
  const { userID, profile } = params;
  return updateMyProfile({ userID, profile });
};

// 닉네임만 수정
export const updateMyNickname = async (params: UpdateMyNicknameParams) => {
  const { userID, nickname } = params;
  return updateMyProfile({ userID, nickname });
};

// 노크 허용 여부 토글
export const toggleKnockPermission = async (params: ToggleKnockPermissionParams) => {
  const { userID } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: { id: true, isKnocked: true },
  });
  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);

  return prisma.user.update({
    where: { id: userID },
    data: { isKnocked: !user.isKnocked },
    select: USER_PROFILE_SELECT,
  });
};

// 랜덤피드 허용 여부 수정 (OFF 시 관련 설정 모두 OFF)
export const updateRandomFeedSetting = async (params: UpdateRandomFeedSettingParams) => {
  const { userID, isRandomFeed } = params;

  const exists = await prisma.user.findUnique({ where: { id: userID }, select: { id: true } });
  if (!exists) throw createError('사용자를 찾을 수 없습니다.', 404);

  const data = isRandomFeed ? { isRandomFeed: true } : { isRandomFeed: false, ...BROWSE_DEPENDENT_RESET };

  return prisma.user.update({
    where: { id: userID },
    data,
    select: USER_PROFILE_SELECT,
  });
};

// 둘러보기 공개 여부 수정
export const updateBrowsePublicSetting = async (params: UpdateBrowsePublicSettingParams) => {
  const { userID, isPublic } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: { id: true, isRandomFeed: true },
  });
  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);
  if (isPublic) assertRandomFeedEnabled(user.isRandomFeed);

  return prisma.user.update({
    where: { id: userID },
    data: { isPublic },
    select: USER_PROFILE_SELECT,
  });
};

// 추천친구 공개 여부 수정
export const updateRecommendPublicSetting = async (params: UpdateRecommendPublicSettingParams) => {
  const { userID, isRecommendPublic } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: { id: true, isRandomFeed: true },
  });
  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);
  if (isRecommendPublic) assertRandomFeedEnabled(user.isRandomFeed);

  return prisma.user.update({
    where: { id: userID },
    data: { isRecommendPublic },
    select: USER_PROFILE_SELECT,
  });
};

// 추천친구 알고리즘 허용 여부 수정
export const updateRecommendEnabledSetting = async (params: UpdateRecommendEnabledSettingParams) => {
  const { userID, isRecommendEnabled } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: { id: true, isRandomFeed: true },
  });
  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);
  if (isRecommendEnabled) assertRandomFeedEnabled(user.isRandomFeed);

  return prisma.user.update({
    where: { id: userID },
    data: { isRecommendEnabled },
    select: USER_PROFILE_SELECT,
  });
};

// 유저코드로 사용자 검색
export const searchUserByCode = async (params: SearchUserByCodeParams) => {
  const { userCode, requestUserID } = params;

  const user = await prisma.user.findUnique({
    where: { userCode },
    select: USER_PUBLIC_PROFILE_SELECT,
  });

  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);

  const [followerCount, followingCount, following] = await Promise.all([
    prisma.follow.count({ where: { followingID: user.id } }),
    prisma.follow.count({ where: { followerID: user.id } }),
    prisma.follow.findUnique({
      where: {
        followerID_followingID: {
          followerID: requestUserID,
          followingID: user.id,
        },
      },
      select: { id: true },
    }),
  ]);

  return {
    ...user,
    followerCount,
    followingCount,
    isFollowing: Boolean(following),
    isMe: user.id === requestUserID,
  };
};

// 특정 유저 프로필 조회
export const getUserProfile = async (params: GetUserProfileParams) => {
  const { userID, requestUserID } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: USER_PUBLIC_PROFILE_SELECT,
  });

  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);

  const [followerCount, followingCount, following] = await Promise.all([
    prisma.follow.count({ where: { followingID: userID } }),
    prisma.follow.count({ where: { followerID: userID } }),
    prisma.follow.findUnique({
      where: {
        followerID_followingID: {
          followerID: requestUserID,
          followingID: userID,
        },
      },
      select: { id: true },
    }),
  ]);

  return {
    ...user,
    followerCount,
    followingCount,
    isFollowing: Boolean(following),
    isMe: user.id === requestUserID,
  };
};
