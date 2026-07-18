import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getNotifications, markAsRead, markAllAsRead, broadcastNotification, getVapidPublicKey, subscribeToPush, testCancelClassPush } from '../controllers/notificationController';

const router = express.Router();

// Public ruta za preuzimanje javnog ključa
router.get('/vapid-key', getVapidPublicKey);

router.use(protect);

router.post('/subscribe', subscribeToPush);
router.get('/', getNotifications);
router.post('/broadcast', broadcastNotification);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

// Test ruta
router.post('/test-cancel-push', testCancelClassPush);

export default router;
