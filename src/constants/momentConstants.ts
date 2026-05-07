export const GPT_MODEL = 'gpt-4o-mini';

export const BUCKET_CATEGORIES = ['공부', '운동', '습관', '독서', '기타'] as const;
export type BucketCategory = (typeof BUCKET_CATEGORIES)[number];

// GPT 프롬프트
export const buildRecommendationPrompt = (
  title: string,
  durationDays: number,
): string => `
프롬프트 내용 필요
사용자의 목표: "${title}"
목표 달성 기간: ${durationDays}일

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "category": "공부 | 운동 | 습관 | 독서 | 기타 중 하나",
  "momentTitleArray": ["세부 할 일 1", "세부 할 일 2", "세부 할 일 3"],
  "fallback": false,
  "errorMsg": ""
}

`;

// GPT 실패 시 fallback 응답
export const buildFallbackResponse = (errorMsg: string) => ({
  category: '기타',
  momentTitleArray: [],
  fallback: true,
  errorMsg,
});