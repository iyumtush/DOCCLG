import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  subject: string,
  text: string
) => {
  // ✅ Debug logs
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

  try {
  console.log("🚀 USING GMAIL 465 CONFIG");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

    console.log("OTP EMAIL WOULD BE SENT TO:", to);
console.log("SUBJECT:", subject);
console.log("TEXT:", text);

return;

    console.log("✅ Email sent to:", to);
  } catch (error) {
  console.error("❌ Email error:", error);
  throw error;
}
};