const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (to, otp) => {

  await transporter.sendMail({
    from: `"Mak Pharma" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset OTP",
    html: `
      <h2>Mak Pharma</h2>
      <p>Your OTP for password reset:</p>
      <h1>${otp}</h1>
      <p>This OTP expires in 5 minutes.</p>
    `
  });

};

module.exports = sendOTPEmail;