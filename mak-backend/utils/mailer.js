const nodemailer = require("nodemailer");

/* ======================================================
   📧 CREATE TRANSPORTER (RENDER SAFE)
====================================================== */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // 🔥 CHANGED
  secure: false,      // 🔥 IMPORTANT (false for 587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/* ======================================================
   📩 SEND OTP EMAIL
====================================================== */
const sendOTPEmail = async (to, otp) => {
  try {

    console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
    console.log("📩 Sending OTP to:", to);

    const info = await transporter.sendMail({
      from: `"Mak Pharma" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🔐 Password Reset OTP",
      html: `
        <h2>Mak Pharma</h2>
        <p>Your OTP:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `
    });

    console.log("✅ EMAIL SENT:", info.response);

  } catch (err) {
    console.error("❌ MAIL ERROR FULL:", err);
  }
};

module.exports = sendOTPEmail;