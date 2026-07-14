import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const amin = await User.findOne({ firstName: 'Amin' });
  console.log('Amin role:', amin?.get('role'));
  console.log('Amin activePackage:', amin?.get('activePackage'));

  const schedule = await mongoose.connection.db!.collection('classsessions').find({ 'students.studentId': amin?._id, status: 'ZAKAZAN' }).toArray();
  console.log('Amin zakazani casovi:', schedule.length);

  process.exit(0);
}

check();
