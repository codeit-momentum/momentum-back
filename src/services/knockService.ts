import { prisma } from '../lib/prisma.js';

const createError = (message: string, statusCode: number): Error => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

// ──────────────────────────────────────────────
// 노크하기
// POST /api/v1/feed/knock/:followingID
// ──────────────────────────────────────────────
export const knockUser = async (knockerID: string, receiverID: string) => {

  // 본인에게 노크 불가
  if (knockerID === receiverID) {
    throw createError('본인에게 노크할 수 없습니다.', 400);
  }

  // 대상 유저 존재 + isKnocked 한번에 확인
  const receiver = await prisma.user.findUnique({
    where: { id: receiverID },
    select: { id: true, isKnocked: true },
  });

  if (!receiver) throw createError('존재하지 않는 유저입니다.', 404);
  if (!receiver.isKnocked) throw createError('노크를 허용하지 않는 유저입니다.', 403);

  // 팔로우 여부 확인
  const follow = await prisma.follow.findUnique({
    where: {
      followerID_followingID: {
        followerID: knockerID,
        followingID: receiverID,
      },
    },
    select: { id: true },
  });

  if (!follow) throw createError('팔로우한 유저에게만 노크할 수 있습니다.', 403);

  // 하루 1회 제한 확인
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayKnock = await prisma.knock.findFirst({
    where: {
      knockerID,
      receiverID,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    select: { id: true },
  });

  if (todayKnock) throw createError('오늘 이미 노크했습니다. 하루 1회만 가능합니다.', 429);

  // 일주일간 모멘트 달성 없는지 확인
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentMoment = await prisma.moment.findFirst({
    where: {
      userID: receiverID,
      isCompleted: true,
      updatedAt: { gte: oneWeekAgo },
    },
    select: { id: true },
  });

  if (recentMoment) {
    throw createError('최근 일주일 내에 모멘트를 달성한 유저에게는 노크할 수 없습니다.', 400);
  }

  // 노크 저장
  const knock = await prisma.knock.create({
    data: {
      knockerID,
      receiverID,
    },
    select: {
      id: true,
      knockerID: true,
      receiverID: true,
      createdAt: true,
    },
  });

  return knock;
};