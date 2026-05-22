import express from 'express';
import { agreeTerms, getTerm, listTerms } from '../controllers/termController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateAgreeTermsBody, validateGetTermParams, validateListTermsQuery } from '../middlewares/termMiddleware.js';

const router = express.Router();

// GET    /api/v1/terms 약관 목록 조회 (JWT 불필요)
router.get('/', validateListTermsQuery, listTerms);

// POST   /api/v1/terms 사용자 약관 동의 (JWT 필요)
router.post('/', authenticate, validateAgreeTermsBody, agreeTerms);

// GET    /api/v1/terms/:termID 약관 단건 조회 (JWT 불필요)
router.get('/:termID', validateGetTermParams, getTerm);

export default router;
