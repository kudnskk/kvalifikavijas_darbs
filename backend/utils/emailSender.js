const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"AI Learning Assistant" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { sendEmail };
