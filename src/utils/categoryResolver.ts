import { BUCKET_CATEGORIES } from '../constants/bucketConstants.js';

export const resolveCategory = (
  category: string,
  customCategory?: string | undefined,
): string => {
  // 기본 카테고리에 없으면 기타로 자동 변환
  if (!BUCKET_CATEGORIES.includes(category as typeof BUCKET_CATEGORIES[number])) {
    return '기타';
  }

  // 기타 선택 + customCategory 있으면 customCategory로 저장
  if (category === '기타' && customCategory && customCategory.trim() !== '') {
    return customCategory.trim();
  }

  // 기본 카테고리면 그대로 반환
  return category;
};