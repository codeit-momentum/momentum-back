import { prisma } from '../lib/prisma.js';

interface CreateBucketParams {
  userID: string;
  title: string;
  category?: string[] | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
}

interface GetBucketDetailParams {
  bucketID: string;
}

interface GetBucketsParams {
  userID: string;
}

interface BucketMutateParams {
  bucketID: string;
  requestUserID: string;
}

const createError = (message: string, statusCode: number): Error => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

// 버킷리스트 생성
export const createBucket = async (params: CreateBucketParams) => {
  const { userID, title, category, startDate, endDate } = params;

  return await prisma.bucket.create({
    data: {
      userID,
      title,
      category: category ?? [],
      startDate: startDate ?? null,
      endDate: endDate ?? null,
    },
    select: {
      id: true,
      userID: true,
      title: true,
      category: true,
      thumbnail: true,
      totalMoment: true,
      completedCount: true,
      isCompleted: true,
      isChallenging: true,
      startDate: true,
      endDate: true,
      totalCheer: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// 버킷리스트 상세 조회 (모멘트 포함)
export const getBucketDetail = async (params: GetBucketDetailParams) => {
  const { bucketID } = params;

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    include: {
      moments: {
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          momentTitle: true,
          isCompleted: true,
          photoUrl: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      user: {
        select: {
          id: true,
          nickname: true,
          profile: true,
          userCode: true,
        },
      },
    },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);

  return bucket;
};

// 버킷리스트 전체 조회 (본인 + 타인)
interface GetBucketsParams {
  userID: string;
  status?: 'completed' | 'challenging' | undefined;
}
export const getBucketsByUser = async (params: GetBucketsParams) => {
  const { userID, status } = params;

  const user = await prisma.user.findUnique({
    where: { id: userID },
    select: { id: true },
  });

  if (!user) throw createError('존재하지 않는 유저입니다.', 404);

  const whereCondition = {
    userID,
    ...(status === 'completed' && {
      isCompleted: true,
      isChallenging: false,
    }),
    ...(status === 'challenging' && {
      isChallenging: true,
      isCompleted: false,
    }),
  };

  const buckets = await prisma.bucket.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userID: true,
      title: true,
      category: true,
      thumbnail: true,
      totalMoment: true,
      completedCount: true,
      isCompleted: true,
      isChallenging: true,
      startDate: true,
      endDate: true,
      totalCheer: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // completed: completedCount === totalMoment 검증
  if (status === 'completed') {
    return buckets.filter(
      (bucket) =>
        bucket.completedCount === bucket.totalMoment &&
        bucket.totalMoment > 0, // 모멘트가 하나도 없는 버킷은 제외
    );
  }

  // challenging: completedCount !== totalMoment 검증 (절대 같으면 안됨)
  if (status === 'challenging') {
    return buckets.filter(
      (bucket) =>
        bucket.completedCount !== bucket.totalMoment,
    );
  }

  return buckets;
};


//버킷리스트 활성화
export const challengeBucket = async (params: BucketMutateParams) => {
  const { bucketID, requestUserID } = params;

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: {
      id: true,
      userID: true,
      isCompleted: true,
      isChallenging: true,
      totalMoment: true,
    },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== requestUserID) throw createError('본인의 버킷리스트만 수정할 수 있습니다.', 403);
  if (bucket.isCompleted) throw createError('이미 달성된 버킷리스트는 활성화할 수 없습니다.', 400);
  if (bucket.isChallenging) throw createError('이미 진행 중인 버킷리스트입니다.', 400);
  if (bucket.totalMoment === 0) throw createError('모멘트가 없는 버킷리스트는 활성화할 수 없습니다.', 400);

  return await prisma.bucket.update({
    where: { id: bucketID },
    data: { isChallenging: true },
    select: {
      id: true,
      userID: true,
      title: true,
      isCompleted: true,
      isChallenging: true,
      totalMoment: true,
      completedCount: true,
      updatedAt: true,
    },
  });
};


// 버킷리스트 비활성화

export const unChallengeBucket = async (params: BucketMutateParams) => {
  const { bucketID, requestUserID } = params;

  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketID },
    select: {
      id: true,
      userID: true,
      isCompleted: true,
      isChallenging: true,
    },
  });

  if (!bucket) throw createError('버킷리스트를 찾을 수 없습니다.', 404);
  if (bucket.userID !== requestUserID) throw createError('본인의 버킷리스트만 수정할 수 있습니다.', 403);
  if (bucket.isCompleted) throw createError('이미 달성된 버킷리스트는 수정할 수 없습니다.', 400);
  if (!bucket.isChallenging) throw createError('진행 중이 아닌 버킷리스트입니다.', 400);

  return await prisma.bucket.update({
    where: { id: bucketID },
    data: { isChallenging: false },
    select: {
      id: true,
      userID: true,
      title: true,
      isCompleted: true,
      isChallenging: true,
      totalMoment: true,
      completedCount: true,
      updatedAt: true,
    },
  });
};


// 진행 중인 버킷리스트 개수 조회
export const getChallengingBucketCount = async (params: GetBucketsParams) => {
  const { userID } = params;

  // 유저 확인 + count 병렬 처리
  const [user, count] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userID },
      select: { id: true },
    }),
    prisma.bucket.count({
      where: {
        userID,
        isChallenging: true,
        isCompleted: false,
      },
    }),
  ]);

  if (!user) throw createError('존재하지 않는 유저입니다.', 404);

  return { userID, challengingCount: count };
};