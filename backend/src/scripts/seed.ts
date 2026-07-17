import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';

// Učitavanje okruženja
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { User } from '../models/User';
import { ClassSession } from '../models/ClassSession';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { Certificate } from '../models/Certificate';

const studentsData = [
  { firstName: 'Nikola', lastName: 'Jovanović', email: 'nikola.j@example.com', package: 'NONE', phone: '060111222' },
  { firstName: 'Ana', lastName: 'Petrović', email: 'ana.p@example.com', package: 'OSNOVNI', phone: '061222333' },
  { firstName: 'Marko', lastName: 'Marković', email: 'marko.m@example.com', package: 'SREDNJI', phone: '062333444' },
  { firstName: 'Jelena', lastName: 'Đorđević', email: 'jelena.dj@example.com', package: 'NAPREDNI', phone: '063444555' },
  { firstName: 'Stefan', lastName: 'Ilić', email: 'stefan.i@example.com', package: 'NONE', phone: '064555666' },
  { firstName: 'Milica', lastName: 'Pavlović', email: 'milica.p@example.com', package: 'OSNOVNI', phone: '065666777' },
  { firstName: 'Luka', lastName: 'Popović', email: 'luka.p@example.com', package: 'SREDNJI', phone: '066777888' },
  { firstName: 'Teodora', lastName: 'Stojanović', email: 'teodora.s@example.com', package: 'NAPREDNI', phone: '060888999' },
  { firstName: 'Filip', lastName: 'Živković', email: 'filip.z@example.com', package: 'NONE', phone: '061999000' },
  { firstName: 'Katarina', lastName: 'Vasić', email: 'katarina.v@example.com', package: 'OSNOVNI', phone: '062000111' },
  { firstName: 'Miloš', lastName: 'Jovančević', email: 'milos.j@example.com', package: 'SREDNJI', phone: '063111222' },
  { firstName: 'Nevena', lastName: 'Kovačević', email: 'nevena.k@example.com', package: 'NAPREDNI', phone: '064222333' },
  { firstName: 'Aleksa', lastName: 'Ristić', email: 'aleksa.r@example.com', package: 'NONE', phone: '065333444' },
  { firstName: 'Sofija', lastName: 'Krstić', email: 'sofija.k@example.com', package: 'OSNOVNI', phone: '066444555' },
  { firstName: 'Nemanja', lastName: 'Mladenović', email: 'nemanja.m@example.com', package: 'SREDNJI', phone: '060555666' },
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error("Nedostaje MONGODB_URI");

    console.log('Povezivanje na bazu...');
    await mongoose.connect(mongoURI);
    console.log('Povezan!');

    console.log('Brisanje stare baze (osim Super Admina)...');
    await ClassSession.deleteMany({});
    await ActivityLog.deleteMany({});
    await Notification.deleteMany({});
    await Certificate.deleteMany({});
    await User.deleteMany({ role: { $ne: 'SUPER_ADMIN' } });

    console.log('Kreiranje profesora...');
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash('lozinka123', salt);

    const profesor = await User.create({
      firstName: 'Profesor',
      lastName: 'Glavni',
      email: 'profesor@elegantcode.com',
      password: hashedPass,
      phoneNumber: '060000000',
      role: 'PROFESOR',
      activePackage: 'NONE',
      isVerified: true,
      isActive: true
    });

    console.log('Kreiranje 15 učenika...');
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });

    for (const data of studentsData) {
      await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPass,
        phoneNumber: data.phone,
        role: 'UCENIK',
        activePackage: data.package,
        isVerified: true,
        isActive: true,
        createdBy: superAdmin ? superAdmin._id : profesor._id,
        progress: {
          currentLevel: Math.floor(Math.random() * 5) + 1,
          totalClassesAttended: Math.floor(Math.random() * 20),
          xp: Math.floor(Math.random() * 1000),
          makeupClassesOwed: Math.floor(Math.random() * 3)
        }
      });
    }

    console.log('Baza uspešno resetovana i seed-ovana!');
    process.exit(0);
  } catch (error) {
    console.error('Greška pri seed-ovanju:', error);
    process.exit(1);
  }
};

seedDB();
