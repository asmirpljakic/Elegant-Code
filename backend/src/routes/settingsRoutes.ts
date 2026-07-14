import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Svi ulogovani korisnici mogu da dohvate podešavanja (kako bi frontend znao cene)
router.get('/', protect, getSettings);

// Samo Admin i SuperAdmin mogu da menjaju podešavanja
router.put('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), updateSettings);

export default router;
