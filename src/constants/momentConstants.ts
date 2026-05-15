export const GPT_MODEL = 'gpt-5.4-mini';

// TODO: AI 담당자 프롬프트 교체 예정
export const buildCategoryPrompt = (title: string): string => `
당신은 버킷리스트 카테고리를 분류하는 AI입니다.
사용자의 버킷리스트 목표: "${title}"

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "category": "공부 | 운동 | 습관 | 독서 | 기타 중 하나",
  "fallback": false,
  "errorMsg": ""
}

규칙:
1. category는 반드시 "공부", "운동", "습관", "독서", "기타" 중 하나
2. fallback은 항상 false
3. errorMsg는 빈 문자열
4. JSON 외 다른 텍스트 절대 포함 금지
`;

export const buildRecommendationPrompt = (
  title: string,
  durationDays: number,
): string => `
당신은 버킷리스트 달성을 도와주는 AI 코치입니다.
사용자의 목표: "${title}"
목표 달성 기간: ${durationDays}일

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "momentTitleArray": ["세부 할 일 1", "세부 할 일 2", "세부 할 일 3"],
  "fallback": false,
  "errorMsg": ""
}

규칙:
1. momentTitleArray는 ${durationDays}일 기간에 맞는 구체적인 세부 할 일 목록
2. 각 모멘트는 하루에 실천 가능한 구체적인 행동으로 작성
3. fallback은 항상 false
4. errorMsg는 빈 문자열
5. JSON 외 다른 텍스트 절대 포함 금지
`;

export const buildCategoryFallback = (errorMsg: string) => ({
  category: '기타',
  fallback: true,
  errorMsg,
});

export const buildRecommendationFallback = (errorMsg: string) => ({
  momentTitleArray: [],
  fallback: true,
  errorMsg,
});