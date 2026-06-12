import express from 'express';
import {
    challengeBucketController,
    createBucketController,
    getBucketDetailController,
    getBucketsByUserController,
    getChallengingBucketCountController,
    unChallengeBucketController,
} from '../controllers/bucketController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBucketID, validateBucketOwner } from '../middlewares/bucketMiddleware.js';

const router = express.Router();

router.use(authenticate);

// POST   /api/v1/buckets 버킷리스트 생성
router.post('/', createBucketController);

// GET    /api/v1/buckets/count/:userID 진행 중인 버킷 개수 조회
router.get('/count/:userID', getChallengingBucketCountController);

// GET    /api/v1/buckets/user/:userID 유저별 버킷 전체 조회 (?status=completed | challenging)
router.get('/user/:userID', getBucketsByUserController);

// PATCH  /api/v1/buckets/challenge/:bucketID 버킷리스트 활성화
router.patch('/challenge/:bucketID', validateBucketID, validateBucketOwner, challengeBucketController);

// PATCH  /api/v1/buckets/un-challenge/:bucketID 버킷리스트 비활성화
router.patch('/un-challenge/:bucketID', validateBucketID, validateBucketOwner, unChallengeBucketController);

// GET    /api/v1/buckets/:bucketID 버킷리스트 상세 조회
router.get('/:bucketID', validateBucketID, getBucketDetailController);


export default router;