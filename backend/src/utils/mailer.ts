import { google } from 'googleapis';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Potreban nam je GOOGLE_REFRESH_TOKEN u .env fajlu (i na Renderu)
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

const createRawEmail = (to: string, otp: string) => {
  const from = `"Elegant Code" <${process.env.EMAIL_USER || 'elegantcodegroup@gmail.com'}>`;
  const subject = 'Verifikacioni Kod - Elegant Code';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e293b; margin: 0;">Elegant Code</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Platforma za učenje programiranja</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #0f172a; margin-top: 0; text-align: center;">Dobrodošli!</h2>
        <p style="color: #334155; line-height: 1.6; text-align: center;">
          Hvala vam na registraciji. Da biste aktivirali svoj nalog, molimo vas da unesete sledeći 6-cifreni kod za verifikaciju:
        </p>
        
        <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
          <div style="font-size: 36px; font-weight: bold; font-family: monospace; color: #3b82f6; user-select: all; cursor: pointer; padding: 10px; background: #e2e8f0; border-radius: 6px; display: inline-block;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 10px; font-family: Arial, sans-serif;">(Dvaput klikni na kod iznad da ga označiš i kopiraš)</p>
        </div>
        
        <p style="color: #64748b; font-size: 13px; text-align: center; margin-bottom: 0;">
          Ovaj kod ističe za <strong>10 minuta</strong>.<br/>
          Ako niste zatražili ovaj kod, možete ignorisati ovaj email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Elegant Code Group. Sva prava zadržana.
      </div>
    </div>
  `;

  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Content-type: text/html;charset=iso-8859-1`,
    `MIME-Version: 1.0`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    '',
    htmlBody,
  ];

  const email = emailLines.join('\r\n').trim();
  // Gmail API zahteva base64url format
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const sendOTP = async (to: string, otp: string) => {
  try {
    // ISPIS OTP-a U KONZOLU ZA SVAKI SLUČAJ
    console.log(`\n=========================================`);
    console.log(`🔔 OTP KOD ZA ${to} JE: ${otp}`);
    console.log(`=========================================\n`);

    const raw = createRawEmail(to, otp);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });

    console.log(`OTP poslata na ${to} preko Gmail REST API-ja`);
  } catch (error) {
    console.error('Greška pri slanju OTP-a preko Gmail API:', error);
    throw new Error('Neuspešno slanje emaila.');
  }
};

const createTrialRawEmail = (to: string, studentName: string, courseName: string, time: string) => {
  const from = `"Elegant Code" <${process.env.EMAIL_USER || 'elegantcodegroup@gmail.com'}>`;
  const subject = 'Novi Probni Čas! - Elegant Code';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e293b; margin: 0;">Novi Učenik!</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <p style="color: #334155; line-height: 1.6;">
          Poštovani,
        </p>
        <p style="color: #334155; line-height: 1.6;">
          Učenik <strong>${studentName}</strong> je upravo zakazao <strong>besplatan probni čas</strong> kod Vas!
        </p>
        <ul style="color: #334155; line-height: 1.6;">
          <li><strong>Kurs:</strong> ${courseName}</li>
          <li><strong>Vreme:</strong> ${time}</li>
        </ul>
        <p style="color: #334155; line-height: 1.6;">
          Molimo vas da uđete na platformu i postavite Google Meet link za ovaj čas.
        </p>
      </div>
    </div>
  `;

  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Content-type: text/html;charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    '',
    htmlBody,
  ];

  const email = emailLines.join('\r\n').trim();
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const sendTrialClassNotification = async (to: string, studentName: string, courseName: string, time: string) => {
  try {
    const raw = createTrialRawEmail(to, studentName, courseName, time);
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    console.log(`Probni cas notifikacija poslata na ${to}`);
  } catch (error) {
    console.error('Greška pri slanju obaveštenja o probnom času:', error);
  }
};
