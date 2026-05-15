import OpenAI from 'openai';
import {
  GPT_MODEL,
  buildCategoryFallback,
  buildCategoryPrompt,
  buildRecommendationFallback,
  buildRecommendationPrompt,
} from '../constants/momentConstants.js';
import { prisma } from '../lib/prisma.js';
import type { GptCategoryResponse, GptRecommendationResponse } from '../types/moment.types.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const createError = (message: string, statusCode: number): Error => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

// ──────────────────────────────────────────────
// API 1: 카테고리 추천
// POST /api/v1/moments/ai/:bucketID/category
// ──────────────────────────────────────────────
export const getAiCategory = async (
  bucketID: string,
  userID: string,
): Promise<GptCategoryResponse> => {

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: { id: true, userID: true, title: true },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 조회할 수 있습니다.', 403);

  try {
    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: 'user', content: buildCategoryPrompt(bucket.title) }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('GPT 응답이 비어있습니다.');

    const parsed = JSON.parse(content) as GptCategoryResponse;
    if (!parsed.category) throw new Error('GPT 응답 형식이 올바르지 않습니다.');

    return parsed;

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'GPT 호출에 실패했습니다.';
    return buildCategoryFallback(errorMsg);
  }
};

// ──────────────────────────────────────────────
// API 2: 모멘트 추천
// POST /api/v1/moments/ai/:bucketID/recommendation
// ──────────────────────────────────────────────
export const getAiRecommendation = async (
  bucketID: string,
  userID: string,
  durationDays: number,
): Promise<GptRecommendationResponse> => {

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: { id: true, userID: true, title: true },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 조회할 수 있습니다.', 403);

  try {
    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: 'user', content: buildRecommendationPrompt(bucket.title, durationDays) }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('GPT 응답이 비어있습니다.');

    const parsed = JSON.parse(content) as GptRecommendationResponse;
    if (!Array.isArray(parsed.momentTitleArray)) throw new Error('GPT 응답 형식이 올바르지 않습니다.');

    return parsed;

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'GPT 호출에 실패했습니다.';
    return buildRecommendationFallback(errorMsg);
  }
};