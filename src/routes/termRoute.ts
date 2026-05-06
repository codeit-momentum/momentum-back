import express from 'express';
import { agreeTerms, getTerm, listTerms } from '../controllers/termController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET    /api/v1/terms 약관 목록 조회 (JWT 불필요)
router.get('/', listTerms);

// POST   /api/v1/terms 사용자 약관 동의 (JWT 필요)
router.post('/', authenticate, agreeTerms);

// GET    /api/v1/terms/:termID 약관 단건 조회 (JWT 불필요)
router.get('/:termID', getTerm);

export default router;

