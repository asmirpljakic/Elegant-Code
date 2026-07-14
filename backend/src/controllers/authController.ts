import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import jsonwebtoken from 'jsonwebtoken';
import { loginSchema, registerSchema } from '@elegant-code/shared';

const generateToken = (user: any) => {
  return jsonwebtoken.sign({ 
    id: user._id || user.id, 
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    progress: user.progress || { xp: 0, currentLevel: 1, totalClassesAttended: 0 },
    activePackage: user.activePackage
  }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validacija zahteva korišćenjem Zod šeme iz shared foldera
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const { firstName, lastName, email, password, phoneNumber } = validation.data;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ error: 'Korisnik sa ovim emailom već postoji' });
      return;
    }

    if (phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        res.status(400).json({ error: 'Korisnik sa ovim brojem telefona već postoji' });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      role: 'UCENIK',
      activePackage: 'NONE'
    });

    // Kreiranje ActivityLog-a
    await ActivityLog.create({
      action: 'NOVI_UCENIK',
      description: `Novi učenik ${firstName} ${lastName} se prijavio za školu programiranja.`
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        activePackage: user.activePackage,
        progress: user.progress,
        token: generateToken(user),
      });
    } else {
      res.status(400).json({ error: 'Nevalidni podaci korisnika' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email });
    
    if (!user) {
      res.status(401).json({ error: 'Neispravan email ili lozinka' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Vaš nalog je deaktiviran. Kontaktirajte administraciju.' });
      return;
    }

    if (await bcrypt.compare(password, user.password || '')) {
      user.lastLoginAt = new Date();
      await user.save();

      res.json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        activePackage: user.activePackage,
        progress: user.progress,
        lastLoginAt: user.lastLoginAt,
        token: generateToken(user),
      });
    } else {
      res.status(401).json({ error: 'Neispravan email ili lozinka' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
