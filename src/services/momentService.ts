import OpenAI from 'openai';
import { FREQUENCY_DAYS } from '../constants/bucketConstants.js';
import {
  GPT_MODEL,
  buildCategoryFallback,
  buildCategoryPrompt,
  buildRecommendationFallback,
  buildRecommendationPrompt,
} from '../constants/momentConstants.js';
import { prisma } from '../lib/prisma.js';
import type {
  ConfirmMomentItem,
  ConfirmMomentsParams,
  GptCategoryResponse,
  GptRecommendationResponse,
} from '../types/moment.types.js';

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



// ──────────────────────────────────────────────
// API 3: 모멘트 확정 저장
// POST /api/v1/moments/ai/:bucketID
// ──────────────────────────────────────────────
export const confirmMoments = async (params: ConfirmMomentsParams) => {
  const { bucketID, userID, category, frequency, startDate, moments } = params;

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: { id: true, userID: true, isCompleted: true },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 수정할 수 있습니다.', 403);
  if (bucket.isCompleted) throw createError('이미 달성된 버킷리스트에는 모멘트를 추가할 수 없습니다.', 400);

  // frequency별 일수
  const frequencyDays = FREQUENCY_DAYS[frequency];
  if (!frequencyDays) throw createError('유효하지 않은 빈도입니다.', 400);

  // 각 모멘트 날짜 자동 계산
  const bucketStart = new Date(startDate);
  const momentDataList = moments.map((moment: ConfirmMomentItem, index: number) => {
    const mStart = new Date(bucketStart);
    mStart.setDate(mStart.getDate() + index * frequencyDays);

    const mEnd = new Date(mStart);
    mEnd.setDate(mEnd.getDate() + frequencyDays);

    return {
      momentTitle: moment.momentTitle,
      startDate: mStart,
      endDate: mEnd,
    };
  });

  // 버킷 endDate = 마지막 모멘트 endDate
  const bucketEnd = momentDataList[momentDataList.length - 1]!.endDate;

  // 트랜잭션: 버킷 업데이트 + 모멘트 일괄 생성
  const [updatedBucket, ...createdMoments] = await prisma.$transaction([
    prisma.bucket.update({
      where: { id: bucketID },
      data: {
        category: [category],
        frequency,
        startDate: bucketStart,
        endDate: bucketEnd,
        totalMoment: moments.length,
      },
      select: {
        id: true,
        userID: true,
        title: true,
        category: true,
        frequency: true,
        startDate: true,
        endDate: true,
        totalMoment: true,
        completedCount: true,
        isCompleted: true,
        isChallenging: true,
        totalCheer: true,
        updatedAt: true,
      },
    }),
    ...momentDataList.map((moment) =>
      prisma.moment.create({
        data: {
          bucketID,
          userID,
          momentTitle: moment.momentTitle,
          startDate: moment.startDate,
          endDate: moment.endDate,
        },
        select: {
          id: true,
          bucketID: true,
          momentTitle: true,
          isCompleted: true,
          photoUrl: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      }),
    ),
  ]);

  return { bucket: updatedBucket, moments: createdMoments };
};