const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await mongoose.connection.db.collection('users').find({ firstName: 'Asmir' }).toArray();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}
run();
