import mongoose from 'mongoose';

export interface ISettings extends mongoose.Document {
  professorClassFee: number;
  packagePrices: {
    OSNOVNI: number;
    SREDNJI: number;
    NAPREDNI: number;
  };
  googleRefreshToken?: string;
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
    }
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
