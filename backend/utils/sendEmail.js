// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || "no-reply@codesync.app";
  const info = await transporter.sendMail({ from, to, subject, html });
  console.log("📧 Email sent:", info.messageId);
  return info;
}

module.exports = sendEmail;
