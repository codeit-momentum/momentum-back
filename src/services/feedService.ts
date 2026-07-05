import { prisma } from '../lib/prisma.js';

// ──────────────────────────────────────────────
// 팔로잉 피드 조회
// GET /api/v1/feed?userID=xxx
// ──────────────────────────────────────────────
export const getFollowingFeed = async (
  myUserID: string,
  targetUserID: string,
  limit: number,
  cursor?: string | undefined,
) => {
  // 일주일 전 날짜
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0);

  // 본인 피드인 경우 팔로우 체크 스킵
  if (myUserID !== targetUserID) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerID_followingID: {
          followerID: myUserID,
          followingID: targetUserID,
        },
      },
      select: { id: true },
    });

    if (!follow) {
      const error = new Error('팔로우한 유저가 아닙니다.') as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }
  }

  const moments = await prisma.moment.findMany({
    where: {
      userID: targetUserID,
      isCompleted: true,
      photoUrl: { not: '' },
      updatedAt: { gte: oneWeekAgo },
      ...(cursor !== undefined && {
        id: { lt: cursor },
      }),
    },
    orderBy: { id: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      momentTitle: true,
      photoUrl: true,
      user: {
        select: {
          id: true,
          nickname: true,
          profile: true,
        },
      },
      bucket: {
        select: {
          id: true,
          title: true,
          totalCheer: true,
        },
      },
    },
  });

  const hasNextPage = moments.length > limit;
  if (hasNextPage) moments.pop();

  const nextCursor = hasNextPage ? moments[moments.length - 1]?.id ?? null : null;

  const feeds = moments.map((moment) => ({
    momentID: moment.id,
    momentTitle: moment.momentTitle,
    photoUrl: moment.photoUrl,
    nickname: moment.user.nickname,
    profile: moment.user.profile,
    userID: moment.user.id,
    bucketID: moment.bucket.id,
    bucketTitle: moment.bucket.title,
    totalCheer: moment.bucket.totalCheer,
  }));

  return { feeds, nextCursor };
};