import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  to: string,
  subject: string,
  text: string
) => {
  try {
    console.log("📧 Sending email via Resend...");

    const data = await resend.emails.send({
  from: "CollegeDocs <onboarding@resend.dev>",
  to,
  subject,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <div style="background:#2563eb;color:white;padding:15px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">CollegeDocs Verification</h2>
      </div>

      <div style="border:1px solid #e5e7eb;padding:30px;border-radius:0 0 8px 8px;">
        <h3>Hello,</h3>

        <p>Your One-Time Password (OTP) for CollegeDocs login is:</p>

        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          text-align:center;
          background:#f3f4f6;
          padding:20px;
          border-radius:8px;
          margin:20px 0;
        ">
          ${text.match(/\\d{6}/)?.[0] || text}
        </div>

        <p>This OTP will expire in <b>5 minutes</b>.</p>

        <p>If you did not request this OTP, please ignore this email.</p>

        <hr style="margin:20px 0;" />

        <p style="font-size:12px;color:#6b7280;">
          © CollegeDocs - Secure Document Management System
        </p>
      </div>
    </div>
  `,
});

    console.log("✅ Email sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};