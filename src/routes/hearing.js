import express from 'express';
import {
  addHearing,
  getUpcomingHearings,
  getHearingHistory,
  updateHearing,
  deleteHearing,
  getActiveReminders,
  markReminderAsRead,
} from '../controllers/hearing.js';
import { protect } from '../middlewares/auth.js';
import { validateHearing } from '../middlewares/validate.js';

const router = express.Router();

router.use(protect); // Secure all routes

// Hearing endpoints
router.route('/')
  .post(validateHearing, addHearing);

router.get('/upcoming', getUpcomingHearings);
router.get('/case/:caseId', getHearingHistory);

router.route('/:id')
  .put(updateHearing)
  .delete(deleteHearing);

// Reminder endpoints (Basic Reminder module)
router.get('/reminders/active', getActiveReminders);
router.put('/reminders/:id/read', markReminderAsRead);

export default router;
