const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'elegantcodegroup@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  console.log('Testing with:');
  console.log('User:', process.env.EMAIL_USER);
  console.log('Pass:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'UNDEFINED');
  
  try {
    const info = await transporter.sendMail({
      from: `"Test Elegant Code" <${process.env.EMAIL_USER}>`,
      to: 'asmirpljakic@gmail.com',
      subject: 'Test Nodemailer',
      text: 'Ovo je probni email sa novog sistema!',
    });
    console.log('USPESNO! Email poslat:', info.messageId);
  } catch (error) {
    console.error('GRESKA PRI SLANJU:', error);
  }
}

testEmail();
