export interface GptCategoryResponse {
  category: string;
  fallback: boolean;
  errorMsg: string;
}

export interface GptRecommendationResponse {
  momentTitleArray: string[];
  fallback: boolean;
  errorMsg: string;
}