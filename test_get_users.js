const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const asmirId = new mongoose.Types.ObjectId("6a5973ac4227002ccc724184");
  
  const professorClasses = await mongoose.connection.db.collection('classsessions').find({ profesorId: asmirId }).toArray();
  const studentIds = new Set();
  
  professorClasses.forEach(cls => {
    cls.students.forEach(st => {
      studentIds.add(st.studentId.toString());
    });
  });

  const createdUsers = await mongoose.connection.db.collection('users').find({ createdBy: asmirId }).toArray();
  createdUsers.forEach(u => studentIds.add(u._id.toString()));

  const query = { _id: { $in: Array.from(studentIds) }, role: { $in: ['UCENIK', 'KLIJENT'] } };
  
  const users = await mongoose.connection.db.collection('users').find(query).limit(1000).toArray();
  console.log("Found students: ", users.map(u => u.firstName));
  process.exit(0);
}
run();
