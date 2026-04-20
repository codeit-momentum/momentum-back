import dotenv from 'dotenv';

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`[config 오류] 필수 환경 변수 누락: ${key}`);
  }

  return value;
}

export const CONFIG = {
  PORT: Number(getEnv('PORT', '3000')),
  DOMAIN: getEnv('DOMAIN', 'localhost'),
  DATABASE_URL: getEnv('DATABASE_URL'),
} as const;
