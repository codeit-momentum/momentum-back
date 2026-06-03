import { RECOMMEND_FRIENDS_LIMIT } from '../constants/userConstants.js';
import { prisma } from '../lib/prisma.js';
import { getBlockedUserIDSet } from './userService.js';
import type { GetRecommendedFriendsParams } from '../types/user.types.js';
import { RECOMMEND_USER_SELECT, type RecommendedFriend } from '../types/recommend.types.js';
import { createError } from '../utils/createError.js';

const collectCategories = (buckets: { category: string[] }[]): Set<string> => {
  return new Set(buckets.flatMap((bucket) => bucket.category));
};

const getMatchedCategories = (myCategories: Set<string>, theirCategories: Set<string>): string[] => {
  return [...myCategories].filter((category) => theirCategories.has(category));
};

// 추천친구 조회 (버킷 카테고리 유사도 기반)
export const getRecommendedFriends = async (params: GetRecommendedFriendsParams): Promise<RecommendedFriend[]> => {
  const { userID } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: { id: true, isRandomFeed: true, isRecommendEnabled: true },
  });
  if (!user) throw createError('사용자를 찾을 수 없습니다.', 404);
  if (!user.isRandomFeed || !user.isRecommendEnabled) {
    throw createError('랜덤피드 및 추천친구 알고리즘이 허용되어 있어야 추천 목록을 조회할 수 있습니다.', 403);
  }

  const [myBuckets, followingRows] = await Promise.all([
    prisma.bucket.findMany({
      where: { userID },
      select: { category: true },
    }),
    prisma.follow.findMany({
      where: { followerID: userID },
      select: { followingID: true },
    }),
  ]);

  const myCategories = collectCategories(myBuckets);
  const blockedIDs = await getBlockedUserIDSet(userID);
  const excludeUserIDs = new Set([userID, ...followingRows.map((row) => row.followingID), ...blockedIDs]);

  const candidates = await prisma.user.findMany({
    where: {
      isRecommendPublic: true,
      id: { notIn: [...excludeUserIDs] },
    },
    select: RECOMMEND_USER_SELECT,
  });

  if (candidates.length === 0) return [];

  const candidateIDs = candidates.map((candidate) => candidate.id);
  const candidateBuckets = await prisma.bucket.findMany({
    where: { userID: { in: candidateIDs } },
    select: { userID: true, category: true },
  });

  const categoriesByUserID = new Map<string, Set<string>>();
  for (const bucket of candidateBuckets) {
    const existing = categoriesByUserID.get(bucket.userID) ?? new Set<string>();
    for (const category of bucket.category) {
      existing.add(category);
    }
    categoriesByUserID.set(bucket.userID, existing);
  }

  const scored: RecommendedFriend[] = candidates.map((candidate) => {
    const theirCategories = categoriesByUserID.get(candidate.id) ?? new Set<string>();
    const matchedCategories = getMatchedCategories(myCategories, theirCategories);

    return {
      ...candidate,
      matchScore: matchedCategories.length,
      matchedCategories,
    };
  });

  return scored
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.nickname.localeCompare(b.nickname);
    })
    .slice(0, RECOMMEND_FRIENDS_LIMIT);
};
