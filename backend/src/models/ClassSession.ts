import mongoose, { Schema, Document } from 'mongoose';

export interface IClassSession extends Document {
  courseName: 'OSNOVNI' | 'SREDNJI' | 'NAPREDNI';
  profesorId: mongoose.Types.ObjectId;
  students: Array<{
    studentId: mongoose.Types.ObjectId;
    attended: boolean;
  }>;
  startTime: Date;
  endTime: Date;
  topic?: string;
  status: 'ZAKAZAN' | 'U_TOKU' | 'ZAVRSEN' | 'OTKAZAN';
  meetingLink?: string;
  recurringGroupId?: string;
  isMakeup?: boolean;
}

const ClassSessionSchema: Schema = new Schema({
  courseName: { type: String, enum: ['OSNOVNI', 'SREDNJI', 'NAPREDNI'] },
  profesorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ 
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    attended: { type: Boolean, default: false }
  }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  topic: { type: String },
  status: { 
    type: String, 
    enum: ['ZAKAZAN', 'U_TOKU', 'ZAVRSEN', 'OTKAZAN'],
    default: 'ZAKAZAN'
  },
  meetingLink: { type: String },
  recurringGroupId: { type: String },
  isMakeup: { type: Boolean, default: false }
}, { timestamps: true });

// Enterprise Optimizacija: Indeksi za ekstremno brze pretrage
// 1. Ubrzava rute gde profesor traži svoje časove sortirane po vremenu
ClassSessionSchema.index({ profesorId: 1, startTime: -1 });

// 2. Ubrzava rute gde učenik traži svoje časove (compound index unutar niza)
ClassSessionSchema.index({ 'students.studentId': 1, startTime: -1 });

// 3. Ubrzava rute koje filtriraju po statusu (npr. ZAKAZAN) i vremenu
ClassSessionSchema.index({ status: 1, startTime: 1 });

// Originalni index za Cron job
ClassSessionSchema.index({ startTime: 1 });

export const ClassSession = mongoose.model<IClassSession>('ClassSession', ClassSessionSchema);
