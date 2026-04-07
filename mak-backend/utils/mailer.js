const nodemailer = require("nodemailer");

// ==============================
// 🚀 CREATE TRANSPORTER
// ==============================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // your gmail
    pass: process.env.EMAIL_PASS    // app password
  }
});

// ==============================
// 📩 SEND OTP EMAIL FUNCTION
// ==============================

const sendOTPEmail = async (to, otp) => {
  try {

    console.log("📩 Sending OTP to:", to);

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

      text: `Your OTP is ${otp} (valid for 5 minutes)`
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ EMAIL SENT:", info.response);

  } catch (err) {
    console.error("❌ EMAIL ERROR:", err);
    throw err; // important for API response
  }
};

module.exports = sendOTPEmail;