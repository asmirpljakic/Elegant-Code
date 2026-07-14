import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.EMAIL_PORT) || 2525,
      auth: {
        user: process.env.EMAIL_USER || 'test',
        pass: process.env.EMAIL_PASS || 'test',
      },
    });

    const mailOptions = {
      from: 'Elegant Code Administracija <admin@elegant-code.rs>',
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email uspešno poslat na ${options.email}`);
  } catch (error) {
    console.error('Greška pri slanju emaila:', error);
  }
};
