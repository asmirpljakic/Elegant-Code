import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PROFESOR' | 'UCENIK' | 'KLIJENT' | 'GOST';
  activePackage: 'OSNOVNI' | 'SREDNJI' | 'NAPREDNI' | 'NONE';
  attendanceMode: 'ONLINE' | 'UZIVO';
  phoneNumber: string;
  progress: {
    currentLevel: number;
    totalClassesAttended: number;
    xp: number;
    makeupClassesOwed?: number;
  };
  lastLoginAt?: Date;
  membershipExpiresAt?: Date;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  googleRefreshToken?: string;
  isVerified: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
  pushSubscriptions?: Array<{
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }>;
  unavailableDates?: string[];
}

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'UCENIK', 'KLIJENT', 'GOST'], 
    default: 'UCENIK' 
  },
  activePackage: { 
    type: String, 
    enum: ['OSNOVNI', 'SREDNJI', 'NAPREDNI', 'NONE'], 
    default: 'NONE' 
  },
  attendanceMode: {
    type: String,
    enum: ['ONLINE', 'UZIVO'],
    default: 'ONLINE'
  },
  progress: {
    currentLevel: { type: Number, default: 1 },
    totalClassesAttended: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    makeupClassesOwed: { type: Number, default: 0 }
  },
  lastLoginAt: { type: Date },
  membershipExpiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  googleRefreshToken: { type: String },
  isVerified: { type: Boolean, default: false },
  otpCode: { type: String },
  otpExpiresAt: { type: Date },
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  }],
  unavailableDates: [{ type: String }]
}, { timestamps: true });

// Indeks za brzu proveru isteklih članarina za učenike
UserSchema.index({ membershipExpiresAt: 1, role: 1 });

// Indeksi za performanse baze
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
