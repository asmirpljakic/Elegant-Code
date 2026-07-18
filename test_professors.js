const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await mongoose.connection.db.collection('users').find({ role: 'PROFESOR' }).toArray();
  console.log("Professors:", users.map(u => u.email));
  process.exit(0);
}
run();
