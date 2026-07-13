import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { loginSchema, registerSchema } from '@elegant-code/shared';
import jsonwebtoken from 'jsonwebtoken';

const generateToken = (id: string) => {
  return jsonwebtoken.sign({ id }, process.env.JWT_SECRET as string, {
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

    const { firstName, lastName, email, password } = validation.data;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ error: 'Korisnik sa ovim emailom već postoji' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
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

    if (user && (await bcrypt.compare(password, user.password || ''))) {
      res.json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ error: 'Neispravan email ili lozinka' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
