const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP credentials are not configured');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_PORT == '465' ? true : true, // use TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // Prevent IPv6 failure by forcing IPv4
    family: 4
  });
};

const getFromAddress = () => process.env.SMTP_FROM || process.env.SMTP_USER;

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });
};

const sendVerificationEmail = async ({ to, fullName, token }) => {
  const subject = 'Your CampusStash verification code';
  const text = [
    `Hello ${fullName},`,
    '',
    'Use this verification code to activate your CampusStash account:',
    '',
    token,
    '',
    'This code expires in 10 minutes.',
  ].join('\n');

  return sendEmail({ to, subject, text });
};

const sendPasswordResetEmail = async ({ to, fullName, token }) => {
  const subject = 'Your CampusStash password reset code';
  const text = [
    `Hello ${fullName},`,
    '',
    'Use this password reset code in the app:',
    '',
    token,
    '',
    'This code expires in 10 minutes.',
  ].join('\n');

  return sendEmail({ to, subject, text });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};