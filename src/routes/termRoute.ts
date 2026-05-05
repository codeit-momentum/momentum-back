import express from 'express';
import { getTerm, listTerms } from '../controllers/termController.js';

const router = express.Router();

router.get('/', listTerms);
router.get('/:id', getTerm);

export default router;

