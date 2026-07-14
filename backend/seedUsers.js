const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const uri = "mongodb+srv://anessuljovicboss_db_user:elegant-code-platform@cluster0.hihscwc.mongodb.net/elegant-code?retryWrites=true&w=majority&appName=Cluster0";

const firstNames = ['Marko', 'Jovan', 'Ana', 'Milica', 'Nikola', 'Stefan', 'Jelena', 'Marija', 'Luka', 'Sara'];
const lastNames = ['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević', 'Ilić', 'Pavlović', 'Kostić', 'Stojanović', 'Popović'];
const packages = ['OSNOVNI', 'SREDNJI', 'NAPREDNI', 'NONE'];
const roles = ['UCENIK', 'KLIJENT'];

// Generiše nasumičan srpski broj telefona
function generatePhoneNumber() {
  const prefix = ['060', '061', '062', '063', '064', '065', '066'];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 cifara
  return `${randomPrefix} ${String(randomNum).slice(0, 3)} ${String(randomNum).slice(3)}`;
}

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Brišemo SVE korisnike osim SUPER_ADMIN-a (tvog naloga)
    const deleteResult = await db.collection('users').deleteMany({ role: { $ne: 'SUPER_ADMIN' } });
    console.log(`Obrisano ${deleteResult.deletedCount} starih korisnika bez broja telefona.`);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('lozinka123', salt);

    const users = [];

    for (let i = 0; i < 10; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      users.push({
        firstName: fName,
        lastName: lName,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@primer.com`,
        password: hashedPassword,
        phoneNumber: generatePhoneNumber(),
        role: roles[Math.floor(Math.random() * roles.length)],
        activePackage: packages[Math.floor(Math.random() * packages.length)],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const insertResult = await db.collection('users').insertMany(users);
    console.log(`Uspešno kreirano ${insertResult.insertedCount} novih korisnika sa brojevima telefona!`);

    process.exit(0);
  } catch (error) {
    console.error('Greška:', error);
    process.exit(1);
  }
}

seed();
