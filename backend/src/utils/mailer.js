const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendPasswordResetEmail(to, resetLink) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: "HRMS Password Reset",
        html: `
      <p>You requested a password reset for your HRMS account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = {
    sendPasswordResetEmail
};