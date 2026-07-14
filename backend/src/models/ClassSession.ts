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
  recurringGroupId: { type: String }
}, { timestamps: true });

// Indeks za brze pretrage termina (npr. Cron job za obaveštavanje 1h pred čas)
ClassSessionSchema.index({ startTime: 1 });

export const ClassSession = mongoose.model<IClassSession>('ClassSession', ClassSessionSchema);
