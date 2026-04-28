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
import { validateBucketID, validateBucketOwner } from '../middlewares/bucketMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createBucketController);
router.get('/count/:userID', getChallengingBucketCountController);
router.get('/user/:userID', getBucketsByUserController);


router.patch('/success/:bucketID', validateBucketID, validateBucketOwner, successBucketController);
router.patch('/challenge/:bucketID', validateBucketID, validateBucketOwner, challengeBucketController);
router.patch('/un-challenge/:bucketID', validateBucketID, validateBucketOwner, unChallengeBucketController);
router.get('/:bucketID', validateBucketID, getBucketDetailController);

export default router;