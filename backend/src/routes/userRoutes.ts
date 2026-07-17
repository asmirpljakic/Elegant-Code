import express from 'express';
import { getUsers, updateUser, createUser, getUserProfile, deleteUser, toggleUserStatus, getPublicProfessors, verifyUserManually } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Dohvatanje sopstvenog profila
router.route('/me').get(protect, getUserProfile);

// Dohvatanje javnih profesora (za probne časove, dostupno svima)
router.route('/professors/public').get(protect, getPublicProfessors);

// Svi od navedenih mogu da listaju korisnike i dodaju nove (kontroler ograničava ko šta sme)
router.route('/')
  .get(protect, authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), getUsers)
  .post(protect, authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), createUser);

// Svi navedeni mogu da ažuriraju i brišu (kontroler proverava dubinska prava)
router.route('/:id')
  .put(protect, authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), updateUser)
  .delete(protect, authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), deleteUser);

// Aktivacija i deaktivacija korisnika
router.route('/:id/status')
  .patch(protect, authorize('SUPER_ADMIN', 'ADMIN'), toggleUserStatus);

// Manuelna verifikacija korisnika
router.route('/:id/verify')
  .patch(protect, authorize('SUPER_ADMIN', 'ADMIN'), verifyUserManually);

export default router;
