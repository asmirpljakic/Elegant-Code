import { Request, Response } from 'express';
import { Certificate } from '../models/Certificate';
import { User } from '../models/User';
import { z } from 'zod';

const approveCertificateSchema = z.object({
  studentId: z.string(),
  courseName: z.string().min(2, 'Naziv kursa mora imati bar 2 karaktera')
});

export const approveCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, courseName } = approveCertificateSchema.parse(req.body);

    const student = await User.findById(studentId);
    if (!student) {
      res.status(404).json({ error: 'Učenik nije pronađen' });
      return;
    }

    const certificate = await Certificate.create({
      studentId,
      issuedBy: req.user?._id,
      courseName
    });

    res.status(201).json(certificate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

export const getMyCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const certificates = await Certificate.find({ studentId: req.user?._id })
      .populate('issuedBy', 'firstName lastName role')
      .populate('studentId', 'firstName lastName')
      .sort({ issueDate: -1 });
      
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStudentCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const certificates = await Certificate.find({ studentId })
      .populate('issuedBy', 'firstName lastName role')
      .populate('studentId', 'firstName lastName')
      .sort({ issueDate: -1 });
      
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
