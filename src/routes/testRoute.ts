import express from 'express';
import { testHelloWorld } from '../controllers/testController.js';

const router = express.Router();

router.get('/test', testHelloWorld);

export default router;
