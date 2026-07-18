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

// Hook za slanje Push Notifikacija kada se kreira nova (pojedinačna)
NotificationSchema.post('save', async function (doc) {
  try {
    const { User } = await import('./User');
    const { sendWebPushNotification } = await import('../utils/webPush');
    
    const user = await User.findById(doc.userId);
    if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const payload = {
        title: doc.title,
        body: doc.message,
        url: '/' // Gde vodi klik
      };

      for (const sub of user.pushSubscriptions) {
        await sendWebPushNotification(sub, payload);
      }
    }
  } catch (error) {
    console.error('Greška u Notification post-save hook-u:', error);
  }
});

// Hook za insertMany (kada se kreiraju masovno)
NotificationSchema.post('insertMany', async function (docs) {
  try {
    const { User } = await import('./User');
    const { sendWebPushNotification } = await import('../utils/webPush');

    for (const doc of docs) {
      const user = await User.findById(doc.userId);
      if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        const payload = {
          title: doc.title,
          body: doc.message,
          url: '/'
        };
        for (const sub of user.pushSubscriptions) {
          await sendWebPushNotification(sub, payload);
        }
      }
    }
  } catch (error) {
    console.error('Greška u Notification insertMany hook-u:', error);
  }
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
