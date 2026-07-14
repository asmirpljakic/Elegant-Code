import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import settingsRoutes from './routes/settingsRoutes';
import googleRoutes from './routes/googleRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { connectDB } from './config/db';
import { startCronJobs } from './jobs/cronJobs';

// Učitavanje varijabli okruženja (mora biti pre inicijalizacije servisa koji ih koriste)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Onemogući keširanje za sve API rute (rešava problem sa brauzerima koji ignorišu polling)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Rute
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Elegant Code API radi!');
});

// Startovanje cron jobova
startCronJobs();

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
  });
};

startServer();
