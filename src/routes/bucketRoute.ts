import express from 'express';
import {
    challengeBucketController,
    createBucketController,
    getBucketDetailController,
    getBucketsByUserController,
    getChallengingBucketCountController,
    successBucketController,
    unChallengeBucketController,
} from '../controllers/bucketController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createBucketController);
router.get('/count/:userID', getChallengingBucketCountController);
router.get('/user/:userID', getBucketsByUserController);
router.patch('/success/:bucketID', successBucketController);
router.patch('/challenge/:bucketID', challengeBucketController);
router.patch('/un-challenge/:bucketID', unChallengeBucketController);
router.get('/:bucketID', getBucketDetailController);

export default router;