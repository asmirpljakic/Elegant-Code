import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import authRoutes from './routes/authRoutes';

// Middleware
app.use(cors());
app.use(express.json());

// Rute
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Elegant Code API radi!');
});

// Inicijalizacija
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
  });
};

startServer();
