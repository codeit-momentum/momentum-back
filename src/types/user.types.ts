// 내 프로필 조회 파라미터
export interface GetMyProfileParams {
  userID: string;
}

// 내 프로필 수정 파라미터 (PATCH 부분 수정)
export interface UpdateMyProfileParams {
  userID: string;
  nickname?: string | undefined;
  profile?: string | undefined;
  isKnocked?: boolean | undefined;
}

// 프로필 응답 shape (Prisma select). API 응답 형태를 한 곳에서 관리.
// `as const` 덕분에 prisma 반환 타입이 정확히 추론됨.
export const USER_PROFILE_SELECT = {
  id: true,
  nickname: true,
  email: true,
  profile: true,
  userCode: true,
  isKnocked: true,
  isAgreed: true,
  createdAt: true,
  updatedAt: true,
} as const;
