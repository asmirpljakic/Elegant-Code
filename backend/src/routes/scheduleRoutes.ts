import express from 'express';
import { getSchedule, createClass, completeClass, cancelClass, deleteClass, updateClass, deleteCompletedClasses } from '../controllers/scheduleController';
import { protect, admin, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Sve rute zahtevaju autentifikaciju
router.use(protect);

router.route('/')
  .get(getSchedule)
  .post(authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), createClass);

router.delete('/completed', authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), deleteCompletedClasses);

router.route('/:id')
  .put(authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), updateClass)
  .delete(authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), deleteClass);

// Trenutno samo admin može završiti svoj čas iz ove rute, 
// ali u kontroleru se proverava da li je to profesorov čas
router.put('/:id/complete', protect, completeClass);

router.put('/:id/cancel', protect, authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), cancelClass);

export default router;
