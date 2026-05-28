import OpenAI from 'openai';
import { FREQUENCY_DAYS } from '../constants/bucketConstants.js';
import {
  buildRecommendationFallback
} from '../constants/momentConstants.js';
import { prisma } from '../lib/prisma.js';
import type {
  ConfirmMomentItem,
  ConfirmMomentsParams,
  GptRecommendationResponse
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
    select: { id: true, userID: true, title: true, category: true },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 조회할 수 있습니다.', 403);

  // bucket category 첫번째 값 사용
  const category = bucket.category[0] ?? '기타';

  try {
    const response = await openai.responses.create({
      prompt: {
        id: 'pmpt_69de281cc8dc819494ef5a9cb55151f60943004c8c748ab3',
        version: '3',
        variables: {
          title: bucket.title,
          userid: userID,
          durationdays: String(durationDays),
          category,
        },
      },
    });

// output JSON 파싱
  const content = response.output
    .filter((item) => item.type === 'message')
    .flatMap((item) => {
      if (item.type !== 'message') return [];
      return item.content
        .filter((c) => c.type === 'output_text')
        .map((c) => {
          if (c.type !== 'output_text') return '';
          return c.text;
        });
    })
    .join('');

    if (!content) throw new Error('GPT 응답이 비어있습니다.');

    const parsed = JSON.parse(content) as {
      title: string;
      category: string;
      userID: string;
      durationDays: number;
      totalMoment: number;
      momentTitleArray: string[];
      fallback: boolean;
      errorMsg: string;
    };

    if (!Array.isArray(parsed.momentTitleArray)) {
      throw new Error('GPT 응답 형식이 올바르지 않습니다.');
    }

    return {
      momentTitleArray: parsed.momentTitleArray,
      fallback: parsed.fallback,
      errorMsg: parsed.errorMsg,
    };

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
  const { bucketID, userID, frequency, startDate, moments } = params;

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: { id: true, userID: true, isCompleted: true, category: true }, // category 조회
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
        category: bucket.category,
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


// ──────────────────────────────────────────────
// 시작 날짜 변경
// PATCH /api/v1/moments/ai/:bucketID/startDate
// ──────────────────────────────────────────────
export const updateStartDate = async (
  bucketID: string,
  userID: string,
  newStartDate: string,
) => {
  // 버킷 존재 + 소유자 + frequency + 모멘트 한번에 조회
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: {
      id: true,
      userID: true,
      isCompleted: true,
      frequency: true,
      moments: {
        orderBy: { startDate: 'asc' },
        select: { id: true },
      },
    },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 수정할 수 있습니다.', 403);
  if (bucket.isCompleted) throw createError('이미 달성된 버킷리스트는 수정할 수 없습니다.', 400);
  if (bucket.moments.length === 0) throw createError('모멘트가 없어 시작 날짜를 변경할 수 없습니다.', 400);

  const frequencyDays = FREQUENCY_DAYS[bucket.frequency];
  if (!frequencyDays) throw createError('유효하지 않은 빈도입니다.', 400);

  const bucketStart = new Date(newStartDate);

  // 각 모멘트 날짜 재계산
  const momentUpdates = bucket.moments.map((moment, index) => {
    const mStart = new Date(bucketStart);
    mStart.setDate(mStart.getDate() + index * frequencyDays);

    const mEnd = new Date(mStart);
    mEnd.setDate(mEnd.getDate() + frequencyDays);

    return prisma.moment.update({
      where: { id: moment.id },
      data: { startDate: mStart, endDate: mEnd },
      select: {
        id: true,
        momentTitle: true,
        startDate: true,
        endDate: true,
        isCompleted: true,
      },
    });
  });

  // 버킷 endDate = 마지막 모멘트 endDate
  const lastIndex = bucket.moments.length - 1;
  const bucketEnd = new Date(bucketStart);
  bucketEnd.setDate(bucketEnd.getDate() + (lastIndex + 1) * frequencyDays);

  // 트랜잭션: 버킷 startDate/endDate + 모멘트 날짜 전체 업데이트
  const [updatedBucket, ...updatedMoments] = await prisma.$transaction([
    prisma.bucket.update({
      where: { id: bucketID },
      data: {
        startDate: bucketStart,
        endDate: bucketEnd,
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
        updatedAt: true,
      },
    }),
    ...momentUpdates,
  ]);

  return { bucket: updatedBucket, moments: updatedMoments };
};

// ──────────────────────────────────────────────
// 수동 모멘트 생성
// POST /api/v1/moments/:bucketID
// ──────────────────────────────────────────────
export const createMoment = async (params: ConfirmMomentsParams) => {
  const { bucketID, userID, frequency, startDate, moments } = params;

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: { id: true, userID: true, isCompleted: true , category: true },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 수정할 수 있습니다.', 403);
  if (bucket.isCompleted) throw createError('이미 달성된 버킷리스트에는 모멘트를 추가할 수 없습니다.', 400);

  const frequencyDays = FREQUENCY_DAYS[frequency];
  if (!frequencyDays) throw createError('유효하지 않은 빈도입니다.', 400);

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

  const bucketEnd = momentDataList[momentDataList.length - 1]!.endDate;

  const [updatedBucket, ...createdMoments] = await prisma.$transaction([
    prisma.bucket.update({
      where: { id: bucketID },
      data: {
        category: bucket.category,
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


// ──────────────────────────────────────────────
// 지금 바로 시작하기
// PATCH /api/v1/moments/:bucketID/start/now
// ──────────────────────────────────────────────
export const startNow = async (bucketID: string, userID: string) => {
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: {
      id: true,
      userID: true,
      isCompleted: true,
      frequency: true,
      moments: {
        orderBy: { startDate: 'asc' },
        select: { id: true },
      },
    },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 수정할 수 있습니다.', 403);
  if (bucket.isCompleted) throw createError('이미 달성된 버킷리스트는 수정할 수 없습니다.', 400);
  if (bucket.moments.length === 0) throw createError('모멘트가 없어 시작할 수 없습니다.', 400);

  const frequencyDays = FREQUENCY_DAYS[bucket.frequency];
  if (!frequencyDays) throw createError('유효하지 않은 빈도입니다.', 400);

  // 오늘 날짜를 startDate로 자동 설정
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 각 모멘트 날짜 재계산
  const momentUpdates = bucket.moments.map((moment, index) => {
    const mStart = new Date(today);
    mStart.setDate(mStart.getDate() + index * frequencyDays);

    const mEnd = new Date(mStart);
    mEnd.setDate(mEnd.getDate() + frequencyDays);

    return prisma.moment.update({
      where: { id: moment.id },
      data: { startDate: mStart, endDate: mEnd },
      select: {
        id: true,
        momentTitle: true,
        isCompleted: true,
        startDate: true,
        endDate: true,
      },
    });
  });

  // 버킷 endDate = 마지막 모멘트 endDate
  const lastIndex = bucket.moments.length - 1;
  const bucketEnd = new Date(today);
  bucketEnd.setDate(bucketEnd.getDate() + (lastIndex + 1) * frequencyDays);

  // 트랜잭션: 버킷 + 모멘트 날짜 업데이트
  const [updatedBucket, ...updatedMoments] = await prisma.$transaction([
    prisma.bucket.update({
      where: { id: bucketID },
      data: {
        startDate: today,
        endDate: bucketEnd,
        isChallenging: true,
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
        updatedAt: true,
      },
    }),
    ...momentUpdates,
  ]);

  return { bucket: updatedBucket, moments: updatedMoments };
};