export const BUCKET_CATEGORIES = ['공부', '운동', '습관', '독서', '기타'] as const;

export type BucketCategory = typeof BUCKET_CATEGORIES[number];