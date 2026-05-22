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

export interface ConfirmMomentItem {
  momentTitle: string;
}

export interface ConfirmMomentsParams {
  bucketID: string;
  userID: string;
  category: string;
  frequency: string;
  startDate: string;
  moments: ConfirmMomentItem[];
}