// GPT 응답 타입
export interface GptRecommendationResponse {
  category: string;
  momentTitleArray: string[];
  fallback: boolean;
  errorMsg: string;
}

// 추천 생성 요청 타입
export interface RecommendationRequestBody {
  title: string;
  durationDays: number;
}

// 추천 응답 타입 (클라이언트에게 반환)
export interface RecommendationResult {
  bucket: {
    title: string;
    userID: string;
    category: string;
    durationDays: number;
    totalMoment: number;
  };
  moments: {
    userID: string;
    momentTitleArray: string[];
    fallback: boolean;
    errorMsg: string;
  };
}