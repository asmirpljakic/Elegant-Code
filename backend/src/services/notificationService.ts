import { Notification, INotification } from '../models/Notification';
import { User } from '../models/User';
import { sendWebPushNotification } from '../utils/webPush';

export const createAndSendNotification = async (payload: any | any[]) => {
  try {
    const docs = Array.isArray(payload) ? payload : [payload];
    if (docs.length === 0) return;

    // 1. Zapiši u bazu
    await Notification.insertMany(docs);

    // 2. Pošalji Push Notifikacije
    for (const doc of docs) {
      if (!doc.userId || !doc.message) continue;

      const user = await User.findById(doc.userId);
      if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        const pushPayload = {
          title: 'Elegant Code',
          body: doc.message,
          url: '/'
        };

        for (const sub of user.pushSubscriptions) {
          try {
            await sendWebPushNotification(sub, pushPayload);
          } catch (e) {
            console.error('Greška pri slanju push notifikacije:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Greška u createAndSendNotification:', error);
  }
};
