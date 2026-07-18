import express from 'express';
import { getSettings, updateSettings, getPublicSettings } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// JAVNA RUTA (Mora biti pre protect-a)
router.get('/public', getPublicSettings);

router.use(protect);

router.route('/')
  .get(getSettings) // Svi ulogovani korisnici mogu da vide podešavanja
  .put(authorize('ADMIN', 'SUPER_ADMIN'), updateSettings); // Samo Admini mogu da menjaju

export default router;
