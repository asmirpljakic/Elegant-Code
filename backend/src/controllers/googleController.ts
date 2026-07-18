import { Request, Response } from 'express';
import { getAuthUrl, handleCallback } from '../services/googleService';

export const googleAuth = (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).send('Nedostaje userId parametar');
  }
  const url = getAuthUrl(userId);
  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const userId = req.query.state as string;
    
    if (!code) {
      return res.status(400).send('Nedostaje kod za autorizaciju');
    }
    if (!userId) {
      return res.status(400).send('Nedostaje state (userId) za autorizaciju');
    }
    
    await handleCallback(code, userId);
    
    // Nakon uspešne autorizacije, vrati korisnika nazad na dashboard/google-meet
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard/google-meet?google=success`);
  } catch (error) {
    console.error('Greška u Google Callback-u:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard/google-meet?google=error`);
  }
};
