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
      from: "onboarding@resend.dev",
      to,
      subject,
      text,
    });

    console.log("✅ Email sent:", data);
    return data;
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};