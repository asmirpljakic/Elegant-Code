import express from 'express';
import { getAnalytics } from '../controllers/analyticsController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Samo admin i superadmin mogu pristupiti analitici
router.get('/', protect, admin, getAnalytics);

export default router;
