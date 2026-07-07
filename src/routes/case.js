import express from 'express';
import {
  addCase,
  getCaseList,
  getCaseDetails,
  updateCase,
  deleteCase,
} from '../controllers/case.js';
import { protect } from '../middlewares/auth.js';
import { validateCase } from '../middlewares/validate.js';

const router = express.Router();

router.use(protect); // Secure all routes in this router

router.route('/')
  .post(validateCase, addCase)
  .get(getCaseList);

router.route('/:id')
  .get(getCaseDetails)
  .put(validateCase, updateCase)
  .delete(deleteCase);

export default router;
