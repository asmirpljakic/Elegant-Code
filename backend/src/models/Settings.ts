import mongoose from 'mongoose';

export interface ISettings extends mongoose.Document {
  professorClassFee: number;
  packagePrices: {
    OSNOVNI: number;
    SREDNJI: number;
    NAPREDNI: number;
  };
  googleRefreshToken?: string;
  maintenanceMode: boolean;
  banners: Array<{
    text: string;
    isActive: boolean;
    link?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new mongoose.Schema(
  {
    professorClassFee: {
      type: Number,
      required: true,
      default: 15
    },
    packagePrices: {
      OSNOVNI: { type: Number, required: true, default: 100 },
      SREDNJI: { type: Number, required: true, default: 150 },
      NAPREDNI: { type: Number, required: true, default: 200 }
    },
    googleRefreshToken: {
      type: String,
      default: null
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    banners: [
      {
        text: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        link: { type: String, default: '' }
      }
    ]
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
