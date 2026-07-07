import express from 'express';
import {
  uploadDocument,
  getDocumentsList,
  deleteDocument,
} from '../controllers/document.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocumentsList);
router.delete('/:id', deleteDocument);

export default router;
