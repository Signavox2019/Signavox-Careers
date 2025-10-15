const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true if using port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // required for some servers
  }
});

async function sendMail({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER, // this will now correctly appear as Bhavani.Thummalapalli@signavoxtechnologies.com
    to,
    subject,
    text,
    html
  });

  console.log('Email sent: %s', info.messageId);
  return info;
}

module.exports = { sendMail };
