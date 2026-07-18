import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      maxPoolSize: 100 // Enterprise optimizacija: Obezbeđuje do 100 paralelnih konekcija ka bazi za visoki saobraćaj
    });
    console.log(`MongoDB Povezan: ${conn.connection.host}`);
  } catch (error) {
    console.error('Greška pri povezivanju sa MongoDB:', error);
    process.exit(1);
  }
};
