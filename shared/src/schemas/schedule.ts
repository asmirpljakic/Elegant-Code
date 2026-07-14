import { z } from 'zod';

export const createScheduleSchema = z.object({
  courseName: z.enum(['OSNOVNI', 'SREDNJI', 'NAPREDNI']),
  profesorId: z.string().min(1, "Profesor je obavezan"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  topic: z.string().optional(),
  meetingLink: z.string().url('Mora biti validan URL').optional().or(z.literal('')),
  studentIds: z.array(z.string()).min(1, 'Mora biti izabran bar jedan učenik'),
  isRecurring: z.boolean().optional(),
  recurringDays: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(), // Očekujemo "HH:mm" format
    endTime: z.string()    // Očekujemo "HH:mm" format
  })).optional(),
  untilDate: z.string().datetime().optional()
});

export type CreateScheduleFormData = z.infer<typeof createScheduleSchema>;

export interface StudentScheduleInfo {
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  attended: boolean;
}

export interface ScheduleResponse {
  _id: string;
  courseName: string;
  profesorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  students: StudentScheduleInfo[];
  startTime: string;
  endTime: string;
  topic?: string;
  status: 'ZAKAZAN' | 'U_TOKU' | 'ZAVRSEN' | 'OTKAZAN';
  meetingLink?: string;
}
