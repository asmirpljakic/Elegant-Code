const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const zinedin = await mongoose.connection.db.collection('users').findOne({ firstName: 'Zinedin' });
  const cls = await mongoose.connection.db.collection('classsessions').findOne({ "students.studentId": zinedin._id });
  console.log("Class:", cls);
  if (cls) {
    const prof = await mongoose.connection.db.collection('users').findOne({ _id: cls.profesorId });
    console.log("Profesor:", prof ? prof.email : 'Not found');
  }
  process.exit(0);
}
run();
