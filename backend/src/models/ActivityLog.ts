import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  action: string;
  description: string;
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema({
  action: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

// Indeks za brzo povlačenje poslednjih aktivnosti
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
