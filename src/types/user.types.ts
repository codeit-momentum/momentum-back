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

// 프로필 이미지만 수정 파라미터
export interface UpdateMyProfileImageParams {
  userID: string;
  profile: string;
}

// 닉네임만 수정 파라미터
export interface UpdateMyNicknameParams {
  userID: string;
  nickname: string;
}

// 노크 허용 여부 토글 파라미터
export interface ToggleKnockPermissionParams {
  userID: string;
}

// 랜덤피드 허용 여부 수정 파라미터
export interface UpdateRandomFeedSettingParams {
  userID: string;
  isRandomFeed: boolean;
}

// 둘러보기 공개 여부 수정 파라미터
export interface UpdateBrowsePublicSettingParams {
  userID: string;
  isPublic: boolean;
}

// 추천친구 공개 여부 수정 파라미터
export interface UpdateRecommendPublicSettingParams {
  userID: string;
  isRecommendPublic: boolean;
}

// 추천친구 알고리즘 허용 여부 수정 파라미터
export interface UpdateRecommendEnabledSettingParams {
  userID: string;
  isRecommendEnabled: boolean;
}

// 추천친구 조회 파라미터
export interface GetRecommendedFriendsParams {
  userID: string;
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
  isRandomFeed: true,
  isPublic: true,
  isRecommendPublic: true,
  isRecommendEnabled: true,
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
