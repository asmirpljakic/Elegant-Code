import { Request, Response } from 'express';
import { getAuthUrl, handleCallback } from '../services/googleService';

export const googleAuth = (req: Request, res: Response) => {
  const url = getAuthUrl();
  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send('Nedostaje kod za autorizaciju');
    }
    
    await handleCallback(code);
    
    // Nakon uspešne autorizacije, vrati korisnika na frontend Settings
    res.redirect('http://localhost:5173/dashboard/settings?google=success');
  } catch (error) {
    console.error('Greška u Google Callback-u:', error);
    res.redirect('http://localhost:5173/dashboard/settings?google=error');
  }
};
