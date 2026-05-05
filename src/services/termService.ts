import { prisma } from '../lib/prisma.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export type TermType = '필수' | '선택';

export type GetTermsQuery = {
  type?: TermType;
};

export function assertObjectId(id: string): void {
  if (!OBJECT_ID_REGEX.test(id)) {
    const error = new Error('유효하지 않은 약관 ID입니다.') as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }
}

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
  assertObjectId(id);

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

