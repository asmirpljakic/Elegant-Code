import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { sendWebPushNotification } from '../utils/webPush';

export const createAndSendNotification = async (payload: any | any[]) => {
  try {
    const docs = Array.isArray(payload) ? payload : [payload];
    if (docs.length === 0) return;
    
    // 1. Zapiši u bazu
    const insertedDocs = await Notification.insertMany(docs);

    // 2. Populiši korisnika da dobijemo pushSubscriptions u jednom upitu
    const populatedDocs = await Notification.populate(insertedDocs, { path: 'userId', select: 'pushSubscriptions' });

    // 3. Pošalji Push Notifikacije
    const pushPromises = populatedDocs.map(async (doc: any) => {
      if (!doc.userId || !doc.message) return;

      const user = doc.userId; // Nakon populate-a, userId je User objekat
      if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        const pushPayload = {
          title: 'Elegant Code',
          body: doc.message,
          url: '/'
        };

        const subPromises = user.pushSubscriptions.map((sub: any) => 
          sendWebPushNotification(sub, pushPayload).catch(e => {
            console.error('Greška pri slanju push notifikacije:', e);
          })
        );
        await Promise.allSettled(subPromises);
      }
    });

    await Promise.allSettled(pushPromises);
  } catch (error) {
    console.error('Greška u createAndSendNotification:', error);
  }
};
