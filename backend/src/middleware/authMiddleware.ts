import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

interface JwtPayload {
  id: string;
  role: string;
}

// Proširivanje Express Request objekta
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      const user = await User.findById(decoded.id).select('-password') as IUser;
      
      if (user && !user.isActive) {
        res.status(403).json({ error: 'NalogDeaktiviran' });
        return;
      }

      req.user = user;

      next();
    } catch (error) {
      res.status(401).json({ error: 'Niste autorizovani, neispravan token' });
    }
  } else {
    res.status(401).json({ error: 'Niste autorizovani, nema tokena' });
  }
};

export const admin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ error: 'Pristup odbijen, potrebne admin privilegije' });
  }
};

export const superAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Pristup odbijen, potrebne Super Admin privilegije' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: `Pristup odbijen. Dozvoljeno za: ${roles.join(', ')}` });
    }
  };
};
