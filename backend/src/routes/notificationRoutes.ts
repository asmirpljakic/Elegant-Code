import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getNotifications, markAsRead, markAllAsRead, broadcastNotification, getVapidPublicKey, subscribeToPush } from '../controllers/notificationController';

const router = express.Router();

// Public ruta za preuzimanje javnog ključa
router.get('/vapid-key', getVapidPublicKey);

router.use(protect);

router.post('/subscribe', subscribeToPush);
router.get('/', getNotifications);
router.post('/broadcast', broadcastNotification);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
