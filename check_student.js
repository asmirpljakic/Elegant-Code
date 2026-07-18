const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await mongoose.connection.db.collection('users').findOne({ firstName: 'Nemanja' });
  console.log(JSON.stringify(user, null, 2));
  process.exit(0);
}
run();
