import express from 'express';
import authRoutes from './auth.js';
import clientRoutes from './client.js';
import caseRoutes from './case.js';
import hearingRoutes from './hearing.js';
import feeRoutes from './fee.js';
import noteRoutes from './note.js';
import documentRoutes from './document.js';
import dashboardRoutes from './dashboard.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Advocate E-Diary API version 1',
    endpoints: {
      auth: '/auth',
      clients: '/clients',
      cases: '/cases',
      hearings: '/hearings',
      fees: '/fees',
      notes: '/notes',
      documents: '/documents',
      dashboard: '/dashboard',
    }
  });
});

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/cases', caseRoutes);
router.use('/hearings', hearingRoutes);
router.use('/fees', feeRoutes);
router.use('/notes', noteRoutes);
router.use('/documents', documentRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
