const axios = require("axios");

const sendOTPEmail = async (to, otp) => {
  try {

    console.log("📩 Sending OTP via Brevo to:", to);

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Mak Pharma",
          email: process.env.EMAIL_USER
        },
        to: [{ email: to }],
        subject: "🔐 Password Reset OTP",
        htmlContent: `
          <h2>Mak Pharma</h2>
          <p>Your OTP:</p>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes</p>
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ EMAIL SENT VIA BREVO:", response.data);

  } catch (err) {
    console.error("❌ BREVO ERROR:", err.response?.data || err.message);
  }
};

module.exports = sendOTPEmail;