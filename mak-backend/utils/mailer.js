const nodemailer = require("nodemailer");

// ==============================
// 🔍 DEBUG ENV (VERY IMPORTANT)
// ==============================

console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "🔑 EMAIL_PASS:",
  process.env.EMAIL_PASS ? "EXISTS ✅" : "MISSING ❌"
);

// ==============================
// 🚀 CREATE TRANSPORTER
// ==============================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // ✅ use 587 instead of 465
  secure: false,      // ✅ false for TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==============================
// 📩 SEND OTP EMAIL FUNCTION
// ==============================

const sendOTPEmail = async (to, otp) => {
  try {
    console.log("📩 Sending OTP to:", to);

    // ✅ VERIFY TRANSPORT (checks Gmail login)
    await transporter.verify();
    console.log("✅ SMTP server is ready");

    const mailOptions = {
      from: `"Mak Pharma" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "🔐 Password Reset OTP - Mak Pharma",

      html: `
        <div style="font-family:Arial;padding:20px">
          <h2 style="color:#6366f1">Mak Pharma</h2>
          <p>Your OTP for password reset:</p>
          <h1 style="letter-spacing:2px">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,

      text: `Your OTP is ${otp} (valid for 5 minutes)`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ EMAIL SENT:", info.response);

    return true;

  } catch (err) {
    console.error("❌ EMAIL ERROR FULL:", err);

    // 🔥 RETURN FALSE INSTEAD OF CRASHING
    return false;
  }
};

module.exports = sendOTPEmail;