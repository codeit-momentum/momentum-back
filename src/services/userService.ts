import {
  NICKNAME_SEARCH_LIMIT,
  NICKNAME_SEARCH_MAX_LENGTH,
} from '../constants/userConstants.js';
import { prisma } from '../lib/prisma.js';
import {
  type EnrichPublicUserParams,
  type GetUserProfileParams,
  USER_PROFILE_SELECT,
  USER_PUBLIC_PROFILE_SELECT,
  type GetMyProfileParams,
  type SearchUserByCodeParams,
  type SearchUsersByNicknameParams,
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

// 차단 관계(양방향) 사용자 ID 집합
export const getBlockedUserIDSet = async (userID: string): Promise<Set<string>> => {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerID: userID }, { blockedID: userID }],
    },
    select: { blockerID: true, blockedID: true },
  });

  const blockedIDs = new Set<string>();
  for (const block of blocks) {
    if (block.blockerID === userID) blockedIDs.add(block.blockedID);
    if (block.blockedID === userID) blockedIDs.add(block.blockerID);
  }
  return blockedIDs;
};

const assertNotBlocked = async (requestUserID: string, targetUserID: string) => {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerID: requestUserID, blockedID: targetUserID },
        { blockerID: targetUserID, blockedID: requestUserID },
      ],
    },
    select: { id: true },
  });
  if (block) throw createError('차단된 사용자입니다.', 403);
};

// 공개 프로필 + 팔로우·차단 관계 정보
export const enrichPublicUser = async (params: EnrichPublicUserParams) => {
  const { user, requestUserID } = params;

  const [followerCount, followingCount, following, blockedByMe, blockedMe] = await Promise.all([
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
    prisma.block.findUnique({
      where: {
        blockerID_blockedID: {
          blockerID: requestUserID,
          blockedID: user.id,
        },
      },
      select: { id: true },
    }),
    prisma.block.findUnique({
      where: {
        blockerID_blockedID: {
          blockerID: user.id,
          blockedID: requestUserID,
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
    isBlocked: Boolean(blockedByMe),
    isBlockedBy: Boolean(blockedMe),
  };
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

  await assertNotBlocked(requestUserID, user.id);

  return enrichPublicUser({ user, requestUserID });
};

// 닉네임으로 사용자 검색 (부분 일치)
export const searchUsersByNickname = async (params: SearchUsersByNicknameParams) => {
  const { nickname, requestUserID } = params;
  const trimmed = nickname.trim();

  if (trimmed.length > NICKNAME_SEARCH_MAX_LENGTH) {
    throw createError(`닉네임은 ${NICKNAME_SEARCH_MAX_LENGTH}자 이내로 검색해야 합니다.`, 400);
  }

  const blockedIDs = await getBlockedUserIDSet(requestUserID);
  const excludeUserIDs = [requestUserID, ...blockedIDs];

  const users = await prisma.user.findMany({
    where: {
      nickname: { contains: trimmed, mode: 'insensitive' },
      id: { notIn: excludeUserIDs },
    },
    select: USER_PUBLIC_PROFILE_SELECT,
    take: NICKNAME_SEARCH_LIMIT,
    orderBy: { nickname: 'asc' },
  });

  return Promise.all(users.map((user) => enrichPublicUser({ user, requestUserID })));
};

// 특정 유저 프로필 조회
export const getUserProfile = async (params: GetUserProfileParams) => {
  const { userID, requestUserID } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: USER_PUBLIC_PROFILE_SELECT,
  });

  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);

  await assertNotBlocked(requestUserID, userID);

  return enrichPublicUser({ user, requestUserID });
};
