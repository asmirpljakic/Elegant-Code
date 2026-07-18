import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

// Učitavanje varijabli okruženja mora biti PRE ostalih import-a jer Node hoistuje importe
dotenv.config();

import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import settingsRoutes from './routes/settingsRoutes';
import googleRoutes from './routes/googleRoutes';
import notificationRoutes from './routes/notificationRoutes';
import certificateRoutes from './routes/certificateRoutes';
import { connectDB } from './config/db';
import { startCronJobs } from './jobs/cronJobs';
import { initSocket } from './socket';

const app = express();
const PORT = process.env.PORT || 5000;

// VAŽNO ZA RENDER: Pošto je app iza Load Balancera (Proxy), moramo reći Expressu da veruje proxy-ju
// kako bi rate limiter čitao pravu IP adresu korisnika (x-forwarded-for), a ne IP adresu Render servera.
app.set('trust proxy', 1);

// OBAVEZNO: CORS mora biti prvi middleware kako bi svaki odgovor (čak i greške) imao CORS zaglavlja
app.use(cors());
app.use(express.json());

// Security Middleware (Enterprise nivo)
// 1. HTTP zaglavlja za zaštitu od uobičajenih ranjivosti
app.use(helmet());

// 2. Rate Limiting za sprečavanje DDoS i Brute Force napada
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 1000, // Dozvoljeno 1000 zahteva po IP adresi u 15 minuta (skalabilan limit)
  message: { error: 'Previše zahteva sa ove IP adrese. Molimo sačekajte 15 minuta.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Specifičan, strožiji Rate Limit za autentifikaciju
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 pokušaja prijave po IP adresi u 15 minuta
  message: { error: 'Previše pokušaja prijave. Molimo sačekajte 15 minuta.' },
});
app.use('/api/auth', authLimiter);

// 3. Sanitizacija ulaznih podataka (sprečavanje NoSQL Injection napada)
app.use(mongoSanitize());

// Standardni middleware (CORS i JSON parser su pomereni na vrh fajla)

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
app.use('/api/certificates', certificateRoutes);

app.get('/', (req, res) => {
  // Trigerujemo nodemon
  res.send('Elegant Code API radi!');
});

// Startovanje cron jobova
startCronJobs();

// Start Server
const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
  });
  
  // Inicijalizacija Socket.IO nad pokrenutim HTTP serverom
  initSocket(server);
};

startServer();
