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


export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
