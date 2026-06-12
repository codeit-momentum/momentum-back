export const BUCKET_CATEGORIES = ['공부', '운동', '습관', '독서', '기타'] as const;
export type BucketCategory = (typeof BUCKET_CATEGORIES)[number];

export const BUCKET_FREQUENCIES = ['daily', 'biDaily', 'weekly'] as const;
export type BucketFrequency = (typeof BUCKET_FREQUENCIES)[number];

// frequency별 일수 계산
export const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  biDaily: 2,
  weekly: 7,
};