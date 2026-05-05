import { prisma } from '../lib/prisma.js';
import { assertObjectId } from '../utils/validators.js';

export type TermType = '필수' | '선택';

export type GetTermsQuery = {
  type?: TermType;
};

export async function getTerms(query: GetTermsQuery) {
  const { type } = query;

  const args: Parameters<typeof prisma.term.findMany>[0] = {
    orderBy: { createdAt: 'desc' },
  };

  if (type) {
    args.where = { type };
  }

  return prisma.term.findMany(args);
}

export async function getTermById(id: string) {
  assertObjectId(id, '약관 ID');

  const term = await prisma.term.findUnique({
    where: { id },
  });

  if (!term) {
    const error = new Error('약관을 찾을 수 없습니다.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return term;
}

// 사용자 약관 동의 처리
// - 필수 약관이 모두 포함되어야 함
// - UserTerm에 동의 기록을 upsert(멱등) + User.isAgreed=true 갱신
export async function agreeToTerms(userId: string, termIds: string[]) {
  // 약관 ID 형식 검증
  for (const id of termIds) {
    assertObjectId(id, '약관 ID');
  }

  // 사용자 + 필수 약관을 병렬로 조회
  const [user, requiredTerms, foundTerms] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.term.findMany({ where: { type: '필수' } }),
    prisma.term.findMany({ where: { id: { in: termIds } } }),
  ]);

  if (!user) {
    const error = new Error('사용자를 찾을 수 없습니다.') as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  // 전달된 약관 ID가 실제로 존재하는지 확인
  const requestedSet = new Set(termIds);
  if (foundTerms.length !== requestedSet.size) {
    const error = new Error('존재하지 않는 약관 ID가 포함되어 있습니다.') as Error & {
      statusCode: number;
    };
    error.statusCode = 400;
    throw error;
  }

  // 필수 약관 누락 여부 확인
  const missingRequired = requiredTerms.filter((t) => !requestedSet.has(t.id));
  if (missingRequired.length > 0) {
    const error = new Error('필수 약관에 모두 동의해야 합니다.') as Error & {
      statusCode: number;
      details: { missingTermIds: string[] };
    };
    error.statusCode = 400;
    error.details = { missingTermIds: missingRequired.map((t) => t.id) };
    throw error;
  }

  const now = new Date();

  // UserTerm upsert + User.isAgreed=true 를 트랜잭션으로 일괄 처리
  await prisma.$transaction([
    ...termIds.map((termID) =>
      prisma.userTerm.upsert({
        where: { userID_termID: { userID: userId, termID } },
        update: { agreed: true, agreedAt: now },
        create: { userID: userId, termID, agreed: true, agreedAt: now },
      }),
    ),
    prisma.user.update({
      where: { id: userId },
      data: { isAgreed: true },
    }),
  ]);

  // 갱신 후 동의 이력과 함께 반환
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userTerms: {
        where: { agreed: true },
        select: { termID: true, agreedAt: true },
      },
    },
  });

  return updatedUser!;
}

// 사용자가 모든 필수 약관에 동의했는지 UserTerm 기준으로 확인
export async function hasAgreedAllRequiredTerms(userId: string): Promise<boolean> {
  const requiredTerms = await prisma.term.findMany({
    where: { type: '필수' },
    select: { id: true },
  });
  if (requiredTerms.length === 0) return true;

  const agreedCount = await prisma.userTerm.count({
    where: {
      userID: userId,
      agreed: true,
      termID: { in: requiredTerms.map((t) => t.id) },
    },
  });

  return agreedCount === requiredTerms.length;
}

