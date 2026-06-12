import { prisma } from '../lib/prisma.js';
import type { BlockUserParams } from '../types/block.types.js';
import { FOLLOW_USER_SELECT } from '../types/follow.types.js';
import { createError } from '../utils/createError.js';

// 사용자 차단 (양방향 팔로우 관계 해제 포함)
export const blockUser = async (params: BlockUserParams) => {
  const { blockerID, blockedID } = params;

  if (blockerID === blockedID) {
    throw createError('자기 자신은 차단할 수 없습니다.', 400);
  }

  const [blocker, blocked, exists] = await Promise.all([
    prisma.user.findUnique({ where: { id: blockerID }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: blockedID }, select: { id: true } }),
    prisma.block.findUnique({
      where: {
        blockerID_blockedID: {
          blockerID,
          blockedID,
        },
      },
      select: { id: true },
    }),
  ]);

  if (!blocker) throw createError('로그인한 사용자를 찾을 수 없습니다.', 404);
  if (!blocked) throw createError('차단할 사용자를 찾을 수 없습니다.', 404);
  if (exists) throw createError('이미 차단한 사용자입니다.', 409);

  return prisma.$transaction(async (tx) => {
    await tx.follow.deleteMany({
      where: {
        OR: [
          { followerID: blockerID, followingID: blockedID },
          { followerID: blockedID, followingID: blockerID },
        ],
      },
    });

    return tx.block.create({
      data: {
        blockerID,
        blockedID,
      },
      include: {
        blocked: { select: FOLLOW_USER_SELECT },
      },
    });
  });
};

// 사용자 차단 해제
export const unblockUser = async (params: BlockUserParams) => {
  const { blockerID, blockedID } = params;

  if (blockerID === blockedID) {
    throw createError('자기 자신은 차단 해제할 수 없습니다.', 400);
  }

  const block = await prisma.block.findUnique({
    where: {
      blockerID_blockedID: {
        blockerID,
        blockedID,
      },
    },
    select: { id: true },
  });

  if (!block) throw createError('차단 관계를 찾을 수 없습니다.', 404);

  return prisma.block.delete({
    where: { id: block.id },
    include: {
      blocked: { select: FOLLOW_USER_SELECT },
    },
  });
};
