const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendEmail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: `"AI Learning Assistant" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendEmail };
