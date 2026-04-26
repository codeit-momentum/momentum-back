import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../../config/config.js';
import type { JwtPayload } from '../types/auth.types.js';

// 인증 미들웨어 — Authorization: Bearer <token> 검증
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization; // Authorization 헤더 추출
  if (!authHeader?.startsWith('Bearer ')) {
    // Bearer 토큰 형식 확인
    res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    return;
  }

  const token = authHeader.split(' ')[1]!; // "Bearer " 이후 토큰 문자열 추출

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as JwtPayload; // JWT 서명 검증 및 디코딩
    req.userId = decoded.userId; // 검증된 userId를 req에 저장
    next(); // 다음 미들웨어/핸들러로 전달
  } catch {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' }); // 토큰 만료 또는 변조
  }
};
