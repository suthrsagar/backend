import express from 'express';
import {
  addNote,
  getNotesList,
  updateNote,
  deleteNote,
} from '../controllers/note.js';
import { protect } from '../middlewares/auth.js';
import { validateNote } from '../middlewares/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(validateNote, addNote)
  .get(getNotesList);

router.route('/:id')
  .put(validateNote, updateNote)
  .delete(deleteNote);

export default router;
