import cron from 'node-cron';
import { ClassSession } from '../models/ClassSession';
import { createMeetingLink } from '../services/googleService';

// Funkcija koja proverava i generiše linkove
export const checkAndGenerateMeetLinks = async () => {
  try {
    const now = new Date();
    
    // Želimo da zahvatimo časove koji počinju za maksimalno 35 minuta, a nisu još počeli (za svaki slučaj)
    // i koji nemaju popunjen meetingLink
    const in35Minutes = new Date(now.getTime() + 35 * 60000);
    
    const upcomingClasses = await ClassSession.find({
      status: 'ZAKAZAN',
      startTime: { $gt: now, $lte: in35Minutes },
      $or: [
        { meetingLink: null },
        { meetingLink: '' }
      ]
    });

    for (const cls of upcomingClasses) {
      console.log(`Pokušavam da generišem Meet link za čas: ${cls._id}`);
      const link = await createMeetingLink(cls.startTime, cls.endTime, cls.topic || 'Čas - Elegant Code');
      
      if (link) {
        cls.meetingLink = link;
        await cls.save();
        console.log(`Uspešno generisan i sačuvan Meet link za čas: ${cls._id}`);
      } else {
        console.log(`Neuspešno generisanje Meet linka za čas: ${cls._id}`);
      }
    }
  } catch (error) {
    console.error('Greška u Cron Job-u za Google Meet:', error);
  }
};

// Pokreni funkciju svakog minuta
export const startCronJobs = () => {
  console.log('Cron Job za Google Meet linkove je inicijalizovan (svakog minuta).');
  cron.schedule('* * * * *', checkAndGenerateMeetLinks);
};
