

export interface GptRecommendationResponse {
  momentTitleArray: string[];
  fallback: boolean;
  errorMsg: string;
}

export interface GptRecommendationRawResponse {
  title: string;
  category: string;
  userID: string;
  totalMoment: number;
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
  frequency: string;
  startDate: string;
  totalMoment: number;
  moments: ConfirmMomentItem[];
}