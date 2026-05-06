import { prisma } from '../lib/prisma.js';
import {
  USER_PROFILE_SELECT,
  type GetMyProfileParams,
  type UpdateMyProfileParams,
} from '../types/user.types.js';
import { createError } from '../utils/createError.js';

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
