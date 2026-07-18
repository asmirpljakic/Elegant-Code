const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const asmirId = "6a5973ac4227002ccc724184"; // Asmir PROFESOR
  const classes = await mongoose.connection.db.collection('classsessions').find({ profesorId: new mongoose.Types.ObjectId(asmirId) }).toArray();
  console.log("Classes found: ", classes.length);
  process.exit(0);
}
run();
