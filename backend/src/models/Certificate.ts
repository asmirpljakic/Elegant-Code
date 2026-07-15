import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  studentId: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  courseName: string;
  issueDate: Date;
  certificateId: string; // Unikatan identifikator sertifikata za verifikaciju (opciono za budućnost)
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseName: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  certificateId: { 
    type: String, 
    unique: true, 
    default: () => Math.random().toString(36).substring(2, 10).toUpperCase() 
  }
}, { timestamps: true });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
