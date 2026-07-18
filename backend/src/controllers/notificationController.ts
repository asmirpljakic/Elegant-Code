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
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
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

    const { title, message, target = 'SVI' } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: 'Naslov i poruka su obavezni.' });
      return;
    }

    // Odredi koga tražimo
    const query: any = { isActive: true };
    if (target === 'PROFESORI') {
      query.role = 'PROFESOR';
    } else if (target === 'UCENICI') {
      query.role = { $in: ['UCENIK', 'KLIJENT'] };
    }

    // Pronađi korisnike prema ciljnoj grupi
    const users = await User.find(query).select('_id');
    
    // Kreiraj notifikacije
    const notifications = users.map(u => ({
      userId: u._id,
      title,
      message,
      type: 'INFO'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      
      // Obavesti klijente preko Socket.IO (emitujemo svima, a klijenti osvežavaju svoje stanje)
      try {
        getIO().emit('new_notification');
      } catch (err) {
        console.error('Socket emit greška pri broadcastu:', err);
      }
    }

    let targetLabel = 'svim korisnicima';
    if (target === 'PROFESORI') targetLabel = 'svim profesorima';
    if (target === 'UCENICI') targetLabel = 'svim učenicima i klijentima';

    res.json({ message: `Obaveštenje uspešno poslato ${targetLabel} (ukupno: ${notifications.length}).` });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri slanju globalnog obaveštenja.' });
  }
};

// @desc    Preuzmi VAPID javni ključ za frontend
// @route   GET /api/notifications/vapid-key
// @access  Public
export const getVapidPublicKey = async (req: Request, res: Response): Promise<void> => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
};

// @desc    Pretplati korisnika na Web Push
// @route   POST /api/notifications/subscribe
// @access  Private
export const subscribeToPush = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { subscription } = req.body;

    if (!userId || !subscription) {
      res.status(400).json({ error: 'Nedostaju podaci za pretplatu.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Korisnik nije pronađen.' });
      return;
    }

    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Proveravamo da li ovaj endpoint već postoji da izbegnemo duplikate
    const existingSubIndex = user.pushSubscriptions.findIndex(
      (sub: any) => sub.endpoint === subscription.endpoint
    );

    if (existingSubIndex === -1) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json({ message: 'Uspešno pretplaćeno na Web Push notifikacije.' });
  } catch (error) {
    console.error('Greška pri pretplati:', error);
    res.status(500).json({ error: 'Greška pri čuvanju pretplate na serveru.' });
  }
};
