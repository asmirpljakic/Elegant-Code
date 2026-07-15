import { google } from 'googleapis';
import { Settings } from '../models/Settings';
import { User } from '../models/User';

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/google/callback'
  );
};

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export const getAuthUrl = (userId: string) => {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Zahteva se consent svaki put da bismo dobili refresh_token
    scope: SCOPES,
    state: userId, // Prosleđujemo userId kroz state
  });
};

export const handleCallback = async (code: string, userId: string) => {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  if (tokens.refresh_token) {
    const user = await User.findById(userId);
    if (user) {
      user.googleRefreshToken = tokens.refresh_token;
      await user.save();
    }
  }
  
  return tokens;
};

export const createMeetingLink = async (startTime: Date, endTime: Date, topic: string, profesorId: string) => {
  try {
    const profesor = await User.findById(profesorId);
    if (!profesor || !profesor.googleRefreshToken) {
      throw new Error(`Google integracija nije konfigurisana za profesora ${profesor?.firstName} (nedostaje refresh token)`);
    }

    const oauth2Client = getOAuth2Client();

    // Postavi refresh token profesora
    oauth2Client.setCredentials({ refresh_token: profesor.googleRefreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: topic || 'Čas - Elegant Code',
      description: 'Video poziv za čas na Elegant Code platformi',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Belgrade',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Belgrade',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1, // Ovo je obavezno za Google Meet
    });

    if (response.data.conferenceData?.entryPoints) {
      const meetLink = response.data.conferenceData.entryPoints.find(ep => ep.entryPointType === 'video')?.uri;
      return meetLink;
    }

    throw new Error('Nije moguće generisati Google Meet link.');
  } catch (error) {
    console.error('Greška pri kreiranju Google Meet linka:', error);
    return null;
  }
};
