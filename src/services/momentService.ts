import OpenAI from 'openai';
import { FREQUENCY_DAYS } from '../constants/bucketConstants.js';
import { buildRecommendationFallback } from '../constants/momentConstants.js';
import { prisma } from '../lib/prisma.js';
import type {
  ConfirmMomentItem,
  ConfirmMomentsParams,
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
// 모멘트 날짜 계산 공통 헬퍼
// ──────────────────────────────────────────────
const calcMomentDates = (
  startDate: Date,
  frequencyDays: number,
  moments: ConfirmMomentItem[],
) => {
  if (moments.length === 0) throw new Error('모멘트가 없습니다.');

  const momentDataList = moments.map((moment, index) => {
    const mStart = new Date(startDate);
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

  return { momentDataList, bucketEnd };
};

// ──────────────────────────────────────────────
// AI 모멘트 추천
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
// 모멘트 저장 공통 로직 (AI 확정 저장 + 수동 생성)
// ──────────────────────────────────────────────
const saveMoments = async (params: ConfirmMomentsParams) => {
  const { bucketID, userID, frequency, startDate, moments } = params;

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: { id: true, userID: true, isCompleted: true },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== userID) throw createError('본인의 버킷리스트만 수정할 수 있습니다.', 403);
  if (bucket.isCompleted) throw createError('이미 달성된 버킷리스트에는 모멘트를 추가할 수 없습니다.', 400);

  const frequencyDays = FREQUENCY_DAYS[frequency];
  if (!frequencyDays) throw createError('유효하지 않은 빈도입니다.', 400);

  const bucketStart = new Date(startDate);
  const { momentDataList, bucketEnd } = calcMomentDates(bucketStart, frequencyDays, moments);

  const [updatedBucket, ...createdMoments] = await prisma.$transaction([
    prisma.bucket.update({
      where: { id: bucketID },
      data: {
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
// AI 모멘트 확정 저장
// POST /api/v1/moments/ai/:bucketID
// ──────────────────────────────────────────────
export const confirmMoments = async (params: ConfirmMomentsParams) => {
  return saveMoments(params);
};

// ──────────────────────────────────────────────
// 수동 모멘트 생성
// POST /api/v1/moments/:bucketID
// ──────────────────────────────────────────────
export const createMoment = async (params: ConfirmMomentsParams) => {
  return saveMoments(params);
};

// ──────────────────────────────────────────────
// 날짜 재계산 공통 로직 (시작 날짜 변경 + 지금 바로 시작)
// ──────────────────────────────────────────────
const recalcMomentDates = async (
  bucketID: string,
  userID: string,
  newStartDate: Date,
) => {
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

  const momentUpdates = bucket.moments.map((moment, index) => {
    const mStart = new Date(newStartDate);
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

  const lastIndex = bucket.moments.length - 1;
  const bucketEnd = new Date(newStartDate);
  bucketEnd.setDate(bucketEnd.getDate() + (lastIndex + 1) * frequencyDays);

  const [updatedBucket, ...updatedMoments] = await prisma.$transaction([
    prisma.bucket.update({
      where: { id: bucketID },
      data: {
        startDate: newStartDate,
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
// 시작 날짜 변경
// PATCH /api/v1/moments/ai/:bucketID/startDate
// ──────────────────────────────────────────────
export const updateStartDate = async (
  bucketID: string,
  userID: string,
  newStartDate: string,
) => {
  return recalcMomentDates(bucketID, userID, new Date(newStartDate));
};

// ──────────────────────────────────────────────
// 지금 바로 시작하기
// PATCH /api/v1/moments/:bucketID/start/now
// ──────────────────────────────────────────────
export const startNow = async (bucketID: string, userID: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await recalcMomentDates(bucketID, userID, today);

  // isChallenging: true 업데이트 추가
  const updatedBucket = await prisma.bucket.update({
    where: { id: bucketID },
    data: { isChallenging: true },
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
  });

  return { bucket: updatedBucket, moments: result.moments };
};


// ──────────────────────────────────────────────
// 모멘트 전체 조회
// GET /api/v1/moments/:bucketID
// ──────────────────────────────────────────────
export const getMoments = async (bucketID: string) => {
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: { id: true },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);

  const moments = await prisma.moment.findMany({
    where: { bucketID },
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      bucketID: true,
      userID: true,
      momentTitle: true,
      isCompleted: true,
      photoUrl: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return moments;
};

// ──────────────────────────────────────────────
// 모멘트 상세 조회
// GET /api/v1/moments/detail/:momentID
// ──────────────────────────────────────────────
export const getMomentDetail = async (momentID: string) => {
  const moment = await prisma.moment.findUnique({
    where: { id: momentID },
    select: {
      id: true,
      bucketID: true,
      userID: true,
      momentTitle: true,
      isCompleted: true,
      photoUrl: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!moment) throw createError('모멘트를 찾을 수 없습니다.', 404);

  return moment;
};



// ──────────────────────────────────────────────
// 모멘트 달성
// PATCH /api/v1/moments/success/:momentID
// ──────────────────────────────────────────────
export const successMoment = async (
  momentID: string,
  userID: string,
  photoUrl: string,
) => {
  // 모멘트 + 버킷 한번에 조회
  const moment = await prisma.moment.findUnique({
    where: { id: momentID },
    select: {
      id: true,
      userID: true,
      bucketID: true,
      isCompleted: true,
      startDate: true,
      endDate: true,
      bucket: {
        select: {
          id: true,
          isChallenging: true,
          isCompleted: true,
          totalMoment: true,
          completedCount: true,
        },
      },
    },
  });

  if (!moment) throw createError('모멘트를 찾을 수 없습니다.', 404);
  if (moment.userID !== userID) throw createError('본인의 모멘트만 달성할 수 있습니다.', 403);
  if (moment.isCompleted) throw createError('이미 달성된 모멘트입니다.', 400);
  if (!moment.bucket.isChallenging) throw createError('진행 중인 버킷리스트가 아닙니다.', 400);
  if (moment.bucket.isCompleted) throw createError('이미 달성된 버킷리스트입니다.', 400);

  // 인증 날짜가 모멘트 기간 내에 있는지 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(moment.startDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(moment.endDate);
  endDate.setHours(0, 0, 0, 0);

  if (today < startDate) throw createError('아직 시작되지 않은 모멘트입니다.', 400);
  if (today > endDate) throw createError('모멘트 기간이 종료되었습니다.', 400);

  // 달성 후 completedCount
  const newCompletedCount = moment.bucket.completedCount + 1;
  const allCompleted = newCompletedCount === moment.bucket.totalMoment;

  // 트랜잭션: 모멘트 달성 + 버킷 업데이트
  const [updatedMoment] = await prisma.$transaction([
    // 모멘트 달성
    prisma.moment.update({
      where: { id: momentID },
      data: {
        isCompleted: true,
        photoUrl,
      },
      select: {
        id: true,
        bucketID: true,
        userID: true,
        momentTitle: true,
        isCompleted: true,
        photoUrl: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
      },
    }),
    // 버킷 completedCount +1
    // 모든 모멘트 달성 시 버킷 isCompleted: true, isChallenging: false
    prisma.bucket.update({
      where: { id: moment.bucketID },
      data: {
        completedCount: { increment: 1 },
        ...(allCompleted && {
          isCompleted: true,
          isChallenging: false,
        }),
      },
    }),
  ]);

  return {
    moment: updatedMoment,
    bucketCompleted: allCompleted,
  };
};



// ──────────────────────────────────────────────
// 오늘 인증 모멘트
// GET /api/v1/moments/today
// ──────────────────────────────────────────────
export const getTodayMoments = async (userID: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const moments = await prisma.moment.findMany({
    where: {
      userID,
      startDate: { lte: tomorrow },  
      endDate: { gte: today },        
      bucket: {
        isChallenging: true,         
        isCompleted: false,       
      },
    },
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      bucketID: true,
      userID: true,
      momentTitle: true,
      isCompleted: true,
      photoUrl: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      bucket: {
        select: {
          id: true,
          title: true,
          category: true,
          thumbnail: true,
        },
      },
    },
  });

  return moments;
};


// ──────────────────────────────────────────────
// 모멘트 삭제
// DELETE /api/v1/moments/:momentID
// ──────────────────────────────────────────────
export const deleteMoment = async (momentID: string, userID: string) => {
  const moment = await prisma.moment.findUnique({
    where: { id: momentID },
    select: {
      id: true,
      userID: true,
      bucketID: true,
      isCompleted: true,
      bucket: {
        select: {
          isCompleted: true,
        },
      },
    },
  });

  if (!moment) throw createError('모멘트를 찾을 수 없습니다.', 404);
  if (moment.userID !== userID) throw createError('본인의 모멘트만 삭제할 수 있습니다.', 403);
  if (moment.bucket.isCompleted) throw createError('달성된 버킷리스트의 모멘트는 삭제할 수 없습니다.', 400);
  if (moment.isCompleted) throw createError('이미 달성된 모멘트는 삭제할 수 없습니다.', 400);

  // 트랜잭션: 모멘트 삭제 + 버킷 totalMoment -1
  await prisma.$transaction([
    prisma.moment.delete({
      where: { id: momentID },
    }),
    prisma.bucket.update({
      where: { id: moment.bucketID },
      data: { totalMoment: { decrement: 1 } },
    }),
  ]);

  return { momentID };
};