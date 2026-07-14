import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

// @desc    Dohvati sve notifikacije za ulogovanog korisnika
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Niste autorizovani.' });
      return;
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Greška pri učitavanju notifikacija.' });
  }
};

// @desc    Označi određenu notifikaciju kao pročitanu
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user?._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notifikacija nije pronađena ili nemate pristup.' });
      return;
    }

    res.json({ message: 'Notifikacija obeležena kao pročitana.', notification });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri obeležavanju notifikacije.' });
  }
};

// @desc    Označi sve notifikacije kao pročitane
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { userId: req.user?._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Sve notifikacije obeležene kao pročitane.' });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri obeležavanju notifikacija.' });
  }
};
