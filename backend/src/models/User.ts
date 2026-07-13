import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PROFESOR' | 'UCENIK' | 'KLIJENT' | 'GOST';
  activePackage: 'OSNOVNI' | 'SREDNJI' | 'NAPREDNI' | 'NONE';
  membershipExpiresAt?: Date;
}

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'UCENIK', 'KLIJENT', 'GOST'], 
    default: 'GOST' 
  },
  activePackage: { 
    type: String, 
    enum: ['OSNOVNI', 'SREDNJI', 'NAPREDNI', 'NONE'], 
    default: 'NONE' 
  },
  membershipExpiresAt: { type: Date }
}, { timestamps: true });

// Indeks za brzu proveru isteklih članarina za učenike
UserSchema.index({ membershipExpiresAt: 1, role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
