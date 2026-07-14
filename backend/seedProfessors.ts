import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User';

dotenv.config();

const seedProfessors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB povezan. Seeding profesora...');

    const professors = [
      {
        firstName: 'Marko',
        lastName: 'Marković',
        email: 'marko.profesor@elegantcode.com',
        phoneNumber: '0601112223',
        password: 'lozinka123',
        role: 'PROFESOR',
      },
      {
        firstName: 'Jelena',
        lastName: 'Jelenković',
        email: 'jelena.profesor@elegantcode.com',
        phoneNumber: '0612223334',
        password: 'lozinka123',
        role: 'PROFESOR',
      }
    ];

    for (const p of professors) {
      // Provera da li već postoji
      const exists = await User.findOne({ email: p.email });
      if (!exists) {
        const newUser = new User(p);
        await newUser.save();
        console.log(`Profesor ${p.firstName} kreiran.`);
      } else {
        console.log(`Profesor ${p.firstName} već postoji.`);
      }
    }

    console.log('Seeding profesora uspešan!');
    process.exit(0);
  } catch (error) {
    console.error('Greška pri seedovanju:', error);
    process.exit(1);
  }
};

seedProfessors();
