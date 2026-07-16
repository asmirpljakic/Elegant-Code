import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // false za port 587, true za port 465
  auth: {
    user: process.env.EMAIL_USER || 'elegantcodegroup@gmail.com',
    pass: process.env.EMAIL_PASS || '', // App password
  },
});

export const sendOTP = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"Elegant Code" <${process.env.EMAIL_USER || 'elegantcodegroup@gmail.com'}>`,
    to,
    subject: 'Verifikacioni Kod - Elegant Code',
    html: `
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP poslata na ${to}`);
  } catch (error) {
    console.error('Greška pri slanju OTP-a:', error);
    throw new Error('Neuspešno slanje emaila.');
  }
};
