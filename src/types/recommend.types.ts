export const RECOMMEND_USER_SELECT = {
  id: true,
  nickname: true,
  profile: true,
  userCode: true,
  isKnocked: true,
} as const;

export interface RecommendedFriend {
  id: string;
  nickname: string;
  profile: string;
  userCode: string;
  isKnocked: boolean;
  matchScore: number;
  matchedCategories: string[];
}
