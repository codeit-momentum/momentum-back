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

// 유저코드 검색 파라미터
export interface SearchUserByCodeParams {
  userCode: string;
  requestUserID: string;
}

// 특정 유저 프로필 조회 파라미터
export interface GetUserProfileParams {
  userID: string;
  requestUserID: string;
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

// 다른 사용자에게 노출되는 공개 프로필 응답 shape
export const USER_PUBLIC_PROFILE_SELECT = {
  id: true,
  nickname: true,
  profile: true,
  userCode: true,
  isKnocked: true,
  createdAt: true,
  updatedAt: true,
} as const;
