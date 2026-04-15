const nodemailer = require("nodemailer");

/* =========================================
   🔍 ENV CHECK (SAFE LOG)
========================================= */

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("⚠️ Email credentials missing in .env");
}

/* =========================================
   🚀 CREATE TRANSPORTER (FIXED)
========================================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  family: 4, // 🔥 FIX: force IPv4 (Render issue)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

/* =========================================
   📩 SEND OTP EMAIL
========================================= */

const sendOTPEmail = async (to, otp) => {
  try {

    if (!to || !otp) {
      console.error("❌ Missing email or OTP");
      return false;
    }

    const mailOptions = {
      from: `"Mak Pharma" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🔐 Password Reset OTP - Mak Pharma",

      html: `
        <div style="font-family:Segoe UI,Arial;padding:20px;background:#f9fafb">
          
          <h2 style="color:#6366f1;margin-bottom:10px;">
            💊 Mak Pharma
          </h2>

          <p style="font-size:14px;color:#333;">
            Your OTP for password reset is:
          </p>

          <div style="
            font-size:28px;
            font-weight:bold;
            letter-spacing:4px;
            margin:20px 0;
            color:#111;
          ">
            ${otp}
          </div>

          <p style="font-size:13px;color:#555;">
            This OTP is valid for <b>5 minutes</b>.
          </p>

          <hr style="margin:20px 0;" />

          <p style="font-size:12px;color:#888;">
            If you didn't request this, please ignore this email.
          </p>

        </div>
      `,

      text: `Mak Pharma OTP: ${otp} (valid for 5 minutes)`
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ OTP Email Sent:", info.response);

    return true;

  } catch (err) {

    console.error("❌ EMAIL ERROR:", err.message);

    return false; // 🔒 same logic
  }
};

/* =========================================
   🚀 EXPORT
========================================= */

module.exports = sendOTPEmail;