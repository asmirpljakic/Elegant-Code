import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: {
    type: String,
    enum: ['INFO', 'SUCCESS', 'WARNING'],
    default: 'INFO'
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indeksiranje radi brzog dohvatanja obaveštenja po korisniku, sortirano po vremenu kreiranja (najnovije prvo)
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Hook za slanje Push Notifikacija pre čuvanja (kako Vercel ne bi ubio proces)
NotificationSchema.pre('save', async function (next) {
  try {
    const { User } = await import('./User');
    const { sendWebPushNotification } = await import('../utils/webPush');
    
    const user = await User.findById(this.userId);
    if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const payload = {
        title: 'Elegant Code',
        body: this.message,
        url: '/' // Gde vodi klik
      };

      for (const sub of user.pushSubscriptions) {
        // Hvatamo grešku unutar petlje da ne bi blokiralo čuvanje u bazu ako push omane
        try {
          await sendWebPushNotification(sub, payload);
        } catch (e) {
          console.error('Greška pri slanju push notifikacije:', e);
        }
      }
    }
  } catch (error) {
    console.error('Greška u Notification pre-save hook-u:', error);
  }
  next();
});

// Hook za insertMany pre čuvanja
NotificationSchema.pre('insertMany', async function (next, docs: any) {
  try {
    const { User } = await import('./User');
    const { sendWebPushNotification } = await import('../utils/webPush');

    const documents = Array.isArray(docs) ? docs : [docs];

    for (const doc of documents) {
      const user = await User.findById(doc.userId);
      if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        const payload = {
          title: 'Elegant Code',
          body: doc.message,
          url: '/'
        };
        for (const sub of user.pushSubscriptions) {
          try {
            await sendWebPushNotification(sub, payload);
          } catch (e) {
            console.error('Greška pri slanju push notifikacije (insertMany):', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Greška u Notification pre-insertMany hook-u:', error);
  }
  next();
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
