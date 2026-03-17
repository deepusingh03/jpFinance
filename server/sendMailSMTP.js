// sendMailSMTP.js
import nodemailer from  "nodemailer";
import process from "process";
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: { rejectUnauthorized: false }
});

export async function sendMailSMTP({ to, subject, text, attachments}) {

  if (!to) throw new Error("Missing recipient email");

  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME || ""}" <${process.env.MAIL_FROM}>`,
    to,
    subject,
    text,
    attachments,
  };
  return transporter.sendMail(mailOptions);
}

// module.exports = { sendMailSMTP };
