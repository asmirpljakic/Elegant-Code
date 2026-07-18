import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';

// Konfiguracija web-push-a
if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:elegantcodegroup@gmail.com', // Mora biti kontakt mail
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn('UPOZORENJE: VAPID ključevi nedostaju u .env fajlu. Web Push neće raditi.');
}

export const sendWebPushNotification = async (subscription: any, payload: any) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error: any) {
    // Greška 410 znači da je pretplata istekla ili ju je korisnik povukao u pretraživaču
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Pretplata je istekla ili ukinuta.');
      throw new Error('SUBSCRIPTION_EXPIRED');
    }
    console.error('Greška pri slanju web push notifikacije:', error);
  }
};
