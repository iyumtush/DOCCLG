import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  subject: string,
  text: string
) => {
  // ✅ Debug logs
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS EXISTS:", !!process.env.EMAIL_PASS);
  try {
  console.log("🚀 USING GMAIL 465 CONFIG");

  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
});

  await transporter.sendMail({
  from: `"CollegeDocs" <${process.env.EMAIL_USER}>`,
  to,
  subject,
  text,
});

console.log("✅ Email sent to:", to);
return;

    console.log("✅ Email sent to:", to);
  } catch (error) {
  console.error("❌ Email error:", error);
  throw error;
}
};