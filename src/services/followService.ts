import { prisma } from '../lib/prisma.js';
import type { FollowUserParams, GetFollowListParams, UpdateFollowFavoriteParams } from '../types/follow.types.js';
import { FOLLOW_USER_SELECT } from '../types/follow.types.js';
import { createError } from '../utils/createError.js';

// 사용자 팔로우
export const followUser = async (params: FollowUserParams) => {
  const { followerID, followingID } = params;

  if (followerID === followingID) {
    throw createError('자기 자신은 팔로우할 수 없습니다.', 400);
  }

  const [follower, following, exists] = await Promise.all([
    prisma.user.findUnique({ where: { id: followerID }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: followingID }, select: { id: true } }),
    prisma.follow.findUnique({
      where: {
        followerID_followingID: {
          followerID,
          followingID,
        },
      },
      select: { id: true },
    }),
  ]);

  if (!follower) throw createError('로그인한 사용자를 찾을 수 없습니다.', 404);
  if (!following) throw createError('팔로우할 사용자를 찾을 수 없습니다.', 404);
  if (exists) throw createError('이미 팔로우한 사용자입니다.', 409);

  return prisma.follow.create({
    data: {
      followerID,
      followingID,
    },
    include: {
      following: { select: FOLLOW_USER_SELECT },
    },
  });
};

// 팔로우 취소
export const unfollowUser = async (params: FollowUserParams) => {
  const { followerID, followingID } = params;

  if (followerID === followingID) {
    throw createError('자기 자신은 팔로우 취소할 수 없습니다.', 400);
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerID_followingID: {
        followerID,
        followingID,
      },
    },
    select: { id: true },
  });

  if (!follow) throw createError('팔로우 관계를 찾을 수 없습니다.', 404);

  return prisma.follow.delete({
    where: { id: follow.id },
    include: {
      following: { select: FOLLOW_USER_SELECT },
    },
  });
};

// 팔로우 즐겨찾기 설정
export const updateFollowFavorite = async (params: UpdateFollowFavoriteParams) => {
  const { followerID, followingID, isFavorite } = params;

  if (followerID === followingID) {
    throw createError('자기 자신은 즐겨찾기 설정할 수 없습니다.', 400);
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerID_followingID: {
        followerID,
        followingID,
      },
    },
    select: { id: true },
  });

  if (!follow) throw createError('팔로우 관계를 찾을 수 없습니다.', 404);

  return prisma.follow.update({
    where: { id: follow.id },
    data: { isFavorite },
    include: {
      following: { select: FOLLOW_USER_SELECT },
    },
  });
};

// 팔로잉 목록 조회
export const getFollowingList = async (params: GetFollowListParams) => {
  const { userID } = params;

  const user = await prisma.user.findUnique({ where: { id: userID }, select: { id: true } });
  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);

  const follows = await prisma.follow.findMany({
    where: { followerID: userID },
    orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
    include: {
      following: { select: FOLLOW_USER_SELECT },
    },
  });

  return follows.map((follow) => ({
    followID: follow.id,
    isFavorite: follow.isFavorite,
    followedAt: follow.createdAt,
    updatedAt: follow.updatedAt,
    user: follow.following,
  }));
};

// 팔로워 목록 조회
export const getFollowerList = async (params: GetFollowListParams) => {
  const { userID, requestUserID } = params;

  const user = await prisma.user.findUnique({ where: { id: userID }, select: { id: true } });
  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);

  const follows = await prisma.follow.findMany({
    where: { followingID: userID },
    orderBy: { updatedAt: 'desc' },
    include: {
      follower: { select: FOLLOW_USER_SELECT },
    },
  });

  const followingIDs = follows.map((follow) => follow.followerID);
  const myFollowing = await prisma.follow.findMany({
    where: {
      followerID: requestUserID,
      followingID: { in: followingIDs },
    },
    select: { followingID: true },
  });
  const myFollowingSet = new Set(myFollowing.map((follow) => follow.followingID));

  return follows.map((follow) => ({
    followID: follow.id,
    followedAt: follow.createdAt,
    updatedAt: follow.updatedAt,
    isFollowing: myFollowingSet.has(follow.followerID),
    user: follow.follower,
  }));
};
