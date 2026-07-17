import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { getIO } from '../socket';

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

    const limit = parseInt(req.query.limit as string) || 5;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    const total = await Notification.countDocuments({ userId });
    
    res.json({ notifications, total });
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

// @desc    Pošalji obaveštenje svim korisnicima (Broadcast)
// @route   POST /api/notifications/broadcast
// @access  Private (Super Admin / Admin)
export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate pravo za ovu akciju.' });
      return;
    }

    const { title, message } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: 'Naslov i poruka su obavezni.' });
      return;
    }

    // Pronađi sve aktivne korisnike
    const users = await User.find({ isActive: true }).select('_id');
    
    // Kreiraj notifikacije za sve korisnike odjednom
    const notifications = users.map(u => ({
      userId: u._id,
      title,
      message,
      type: 'INFO'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      
      // Obavesti sve klijente preko Socket.IO u realnom vremenu
      try {
        getIO().emit('new_notification');
      } catch (err) {
        console.error('Socket emit greška pri broadcastu:', err);
      }
    }

    res.json({ message: `Obaveštenje uspešno poslato svima (${notifications.length} korisnika).` });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri slanju globalnog obaveštenja.' });
  }
};
