import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  name: string = "User"
) => {
  try {
    console.log("📧 USING GMAIL SMTP");
    console.log("📨 RECIPIENT:", to);
    console.log("📨 SUBJECT:", subject);
    console.log("📨 NAME:", name);

    const otp = text.match(/\d{6}/)?.[0] || "000000";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("✅ SMTP VERIFIED");

    const info = await transporter.sendMail({
      from: `"CollegeDocs" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">

  <div style="background:#2563eb;color:white;padding:15px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;">CollegeDocs Verification</h2>
  </div>

  <div style="border:1px solid #e5e7eb;padding:30px;border-radius:0 0 8px 8px;">

    <h3>Hello, ${name || "User"} 👋</h3>

    <p>Your One-Time Password (OTP) for CollegeDocs login is:</p>

    <div style="
      font-size:42px;
      font-weight:700;
      letter-spacing:8px;
      text-align:center;
      background:#f3f4f6;
      padding:20px;
      border-radius:8px;
      margin:20px 0;
    ">
      ${otp}
    </div>

    <p>This OTP will expire in <b>5 minutes</b>.</p>

    <p>If you did not request this OTP, please ignore this email.</p>

    <hr style="margin:20px 0;" />

    <p style="font-size:12px;color:#6b7280;">
      © CollegeDocs - College Document Management System
    </p>

  </div>
</div>
`,
    });

    console.log("✅ EMAIL SENT:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ EMAIL ERROR:", error);
    throw error;
  }
};