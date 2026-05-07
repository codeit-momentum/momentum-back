import OpenAI from 'openai';
import {
  GPT_MODEL,
  buildFallbackResponse,
  buildRecommendationPrompt,
} from '../constants/momentConstants.js';
import { prisma } from '../lib/prisma.js';
import type { GptRecommendationResponse, RecommendationResult } from '../types/moment.types.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 에러 생성 헬퍼
const createError = (message: string, statusCode: number): Error => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

// ──────────────────────────────────────────────
// GPT 추천 생성
// POST /api/v1/moments/ai/:bucketID/recommendation
// ──────────────────────────────────────────────
export const getAiRecommendation = async (
  bucketID: string,
  title: string,
  userID: string,
  durationDays: number,
): Promise<RecommendationResult> => {

  // 버킷 존재 확인
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: { id: true, userID: true },
  });
  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 수정할 수 있습니다.', 403);

  // GPT 호출
  let gptResult: GptRecommendationResponse;

  try {
    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'user',
          content: buildRecommendationPrompt(title, durationDays),
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('GPT 응답이 비어있습니다.');

    // JSON 파싱
    const parsed = JSON.parse(content) as GptRecommendationResponse;

    // GPT 응답 유효성 검사
    if (!parsed.category || !Array.isArray(parsed.momentTitleArray)) {
      throw new Error('GPT 응답 형식이 올바르지 않습니다.');
    }

    gptResult = parsed;

  } catch (err) {
    // GPT 호출 실패 시 fallback 처리
    const errorMsg = err instanceof Error ? err.message : 'GPT 호출에 실패했습니다.';
    gptResult = buildFallbackResponse(errorMsg);
  }

  return {
    bucket: {
      title,
      userID,
      category: gptResult.category,
      durationDays,
      totalMoment: gptResult.momentTitleArray.length,
    },
    moments: {
      userID,
      momentTitleArray: gptResult.momentTitleArray,
      fallback: gptResult.fallback,
      errorMsg: gptResult.errorMsg,
    },
  };
};