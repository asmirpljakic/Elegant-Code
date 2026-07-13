import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Povezan: ${conn.connection.host}`);
  } catch (error) {
    console.error('Greška pri povezivanju sa MongoDB:', error);
    process.exit(1);
  }
};
