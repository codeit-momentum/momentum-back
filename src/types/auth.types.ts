// 카카오 토큰 발급 응답
export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
}

// 카카오 사용자 정보 조회 응답
export interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

// JWT 토큰 페이로드
export interface JwtPayload {
  userId: string;
}

// accessToken + refreshToken 쌍
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
