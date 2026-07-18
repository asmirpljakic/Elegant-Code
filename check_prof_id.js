const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const prof = await mongoose.connection.db.collection('users').findOne({ email: 'asmirpljakic@gmail.com' });
  console.log("Prof ID:", prof ? prof._id.toString() : 'Not found');
  process.exit(0);
}
run();
