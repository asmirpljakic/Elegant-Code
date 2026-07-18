const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const zinedin = await mongoose.connection.db.collection('users').findOne({ firstName: 'Zinedin' });
  if (!zinedin) {
    console.log("Zinedin not found");
    process.exit(0);
  }
  const classes = await mongoose.connection.db.collection('classsessions').find({ "students.studentId": zinedin._id }).toArray();
  console.log("Zinedin's classes count:", classes.length);
  process.exit(0);
}
run();
