import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import jsonwebtoken from 'jsonwebtoken';
import { loginSchema, registerSchema } from '@elegant-code/shared';
import { getIO } from '../socket';

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

    // Generisanje 6-cifrenog OTP-a
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minuta

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      role: 'GOST',
      activePackage: 'NONE',
      isVerified: false,
      otpCode,
      otpExpiresAt
    });

    // Kreiranje ActivityLog-a
    await ActivityLog.create({
      action: 'NOVI_UCENIK',
      description: `Novi učenik ${firstName} ${lastName} se prijavio za školu programiranja. Čeka verifikaciju emaila.`
    });

    // Slanje OTP emaila (koristimo novi mailer util) u pozadini (asinhrono) kako ne bismo blokirali odgovor
    import('../utils/mailer').then(({ sendOTP }) => {
      sendOTP(email, otpCode).catch(mailErr => {
        console.error('Neuspešno slanje OTP emaila prilikom registracije:', mailErr);
      });
    });

    // Emitovanje dogadjaja za klijente
    try {
      getIO().emit('users_updated');
    } catch (e) {
      console.error('Socket.IO emit error:', e);
    }

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

    // NOVA PROVERA ZA OTP
    if (user.role === 'GOST' && user.isVerified === false) {
      res.status(403).json({ error: 'Moraš verifikovati svoj email nalog pre logovanja.', unverifiedEmail: user.email });
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

// --- OTP Funkcionalnosti ---

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otpCode } = req.body;
    
    if (!email || !otpCode) {
      res.status(400).json({ error: 'Email i OTP kod su obavezni.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'Korisnik sa ovim emailom nije pronađen.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ error: 'Korisnik je već verifikovan.' });
      return;
    }

    if (user.otpCode !== otpCode) {
      res.status(400).json({ error: 'Neispravan verifikacioni kod.' });
      return;
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      res.status(400).json({ error: 'Verifikacioni kod je istekao. Zatražite novi kod.' });
      return;
    }

    // Uspešna verifikacija
    user.isVerified = true;
    user.role = 'UCENIK';
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    await ActivityLog.create({
      action: 'EMAIL_VERIFIKACIJA',
      description: `Učenik ${user.firstName} ${user.lastName} je uspešno verifikovao email.`
    });

    res.json({
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      activePackage: user.activePackage,
      progress: user.progress,
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri verifikaciji koda.' });
  }
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ error: 'Email je obavezan.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'Korisnik nije pronađen.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ error: 'Nalog je već verifikovan.' });
      return;
    }

    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = newOtpCode;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    const { sendOTP } = await import('../utils/mailer');
    try {
      await sendOTP(email, newOtpCode);
    } catch (mailErr) {
      console.error('Neuspešno slanje OTP emaila prilikom ponovnog slanja:', mailErr);
    }

    res.json({ message: 'Novi kod je uspešno poslat na vaš email.' });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri ponovnom slanju koda.' });
  }
};
