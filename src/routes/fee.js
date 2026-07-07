import express from 'express';
import {
  addFee,
  getFeesList,
  getPendingFees,
  updateFee,
  deleteFee,
} from '../controllers/fee.js';
import { protect } from '../middlewares/auth.js';
import { validateFee } from '../middlewares/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(validateFee, addFee)
  .get(getFeesList);

router.get('/pending', getPendingFees);

router.route('/:id')
  .put(updateFee)
  .delete(deleteFee);

export default router;
