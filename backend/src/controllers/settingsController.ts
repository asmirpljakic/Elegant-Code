import { Request, Response } from 'express';
import { Settings } from '../models/Settings';

// Helper da uvek imamo bar jedan settings dokument
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      professorClassFee: 15,
      packagePrices: {
        OSNOVNI: 100,
        SREDNJI: 150,
        NAPREDNI: 200
      }
    });
  }
  return settings;
};

// @desc    Dohvati podešavanja
// @route   GET /api/settings
// @access  Private (Svi ulogovani korisnici mogu da vide, ali Admin menja)
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Greška pri dohvatanju podešavanja' });
  }
};

// @desc    Ažuriraj podešavanja
// @route   PUT /api/settings
// @access  Private/Admin, SuperAdmin
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professorClassFee, packagePrices, banners } = req.body;
    
    // Provera permisija se radi u middleware-u, ali duplo je bezbednije
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Nemanje privilegija za izmenu podešavanja' });
      return;
    }

    const settings = await getOrCreateSettings();
    
    if (professorClassFee !== undefined) {
      settings.professorClassFee = professorClassFee;
    }
    
    if (packagePrices) {
      if (packagePrices.OSNOVNI !== undefined) settings.packagePrices.OSNOVNI = packagePrices.OSNOVNI;
      if (packagePrices.SREDNJI !== undefined) settings.packagePrices.SREDNJI = packagePrices.SREDNJI;
      if (packagePrices.NAPREDNI !== undefined) settings.packagePrices.NAPREDNI = packagePrices.NAPREDNI;
    }
    
    if (banners !== undefined) {
      settings.banners = banners;
    }
    
    await settings.save();
    
    res.json({ message: 'Podešavanja su uspešno ažurirana', settings });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri ažuriranju podešavanja' });
  }
};
