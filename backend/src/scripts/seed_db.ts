import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { ClassSession } from '../models/ClassSession';
import { ActivityLog } from '../models/ActivityLog';

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/elegant-code');
    console.log('MongoDB connected.');

    // Brisanje svih časova i logova
    await ClassSession.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Obrisani svi časovi i logovi.');

    // Zadrži samo elegantcodegroup@gmail.com
    await User.deleteMany({ email: { $ne: 'elegantcodegroup@gmail.com' } });
    console.log('Obrisani svi korisnici osim elegantcodegroup@gmail.com.');

    // Kreiraj 10 učenika
    const hashedPassword = await bcrypt.hash('Sifra123!', 10);
    const ucenici = [];
    for (let i = 1; i <= 10; i++) {
      ucenici.push({
        firstName: `Ucenik${i}`,
        lastName: `Prezime${i}`,
        email: `ucenik${i}@gmail.com`,
        password: hashedPassword,
        role: 'UCENIK',
        phoneNumber: `060123456${i}`,
        dateOfBirth: new Date(2005, 1, i),
        activePackage: 'SREDNJI',
        progress: {
          currentLevel: 1,
          totalClassesAttended: 0,
          xp: 0
        }
      });
    }
    
    // Dodaj i jednog profesora radi testiranja
    ucenici.push({
      firstName: `Profesor`,
      lastName: `Test`,
      email: `profesor@gmail.com`,
      password: hashedPassword,
      role: 'PROFESOR',
      phoneNumber: `0609999999`,
      dateOfBirth: new Date(1990, 1, 1),
      activePackage: 'SREDNJI',
      progress: {
        currentLevel: 1,
        totalClassesAttended: 0,
        xp: 0
      }
    });

    await User.insertMany(ucenici);
    console.log('Uspešno kreirano 10 učenika i 1 profesor. (Šifra za sve: Sifra123!)');

    process.exit(0);
  } catch (error) {
    console.error('Greška pri seed-ovanju:', error);
    process.exit(1);
  }
};

seedDB();
