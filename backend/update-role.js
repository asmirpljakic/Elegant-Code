const mongoose = require('mongoose');
const uri = "mongodb+srv://anessuljovicboss_db_user:elegant-code-platform@cluster0.hihscwc.mongodb.net/elegant-code?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateMany({}, { $set: { role: 'SUPER_ADMIN' } });
    console.log(`Updated ${result.modifiedCount} users to SUPER_ADMIN`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
