const nodemailer = require("nodemailer");

/* ======================================================
   📧 CREATE TRANSPORTER (STABLE CONFIG)
====================================================== */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ======================================================
   📩 SEND OTP EMAIL
====================================================== */
const sendOTPEmail = async (to, otp) => {
  try {

    console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
    console.log("📧 EMAIL_PASS EXISTS:", process.env.EMAIL_PASS ? "YES" : "NO");
    console.log("📩 Sending OTP to:", to);

    const info = await transporter.sendMail({
      from: `"Mak Pharma" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "🔐 Password Reset OTP - Mak Pharma",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#4CAF50;">Mak Pharma</h2>
          <p>Your OTP for password reset:</p>
          <h1 style="color:#333;">${otp}</h1>
          <p>This OTP expires in 5 minutes.</p>
        </div>
      `
    });

    console.log("✅ EMAIL SENT SUCCESS:", info.response);

  } catch (err) {
    console.error("❌ MAIL ERROR FULL:", err);
  }
};

module.exports = sendOTPEmail;