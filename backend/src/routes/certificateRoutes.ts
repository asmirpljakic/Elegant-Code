import express from 'express';
import { approveCertificate, getMyCertificates, getStudentCertificates } from '../controllers/certificateController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Učenik preuzima svoje sertifikate
router.get('/my', protect, getMyCertificates);

// Admin i Profesor gledaju sve sertifikate za određenog učenika
router.get('/:studentId', protect, authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), getStudentCertificates);

// Admin i Profesor odobravaju sertifikat
router.post('/approve', protect, authorize('SUPER_ADMIN', 'ADMIN', 'PROFESOR'), approveCertificate);

export default router;
