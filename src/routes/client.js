import express from 'express';
import {
  addClient,
  getClientList,
  getClientDetails,
  updateClient,
  deleteClient,
} from '../controllers/client.js';
import { protect } from '../middlewares/auth.js';
import { validateClient } from '../middlewares/validate.js';

const router = express.Router();

router.use(protect); // Secure all routes in this router

router.route('/')
  .post(validateClient, addClient)
  .get(getClientList);

router.route('/:id')
  .get(getClientDetails)
  .put(validateClient, updateClient)
  .delete(deleteClient);

export default router;
