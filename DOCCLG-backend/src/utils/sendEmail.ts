export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  name: string = "User"
) => {
  try {
    console.log("📧 USING BREVO API");
    console.log("📨 RECIPIENT:", to);

const isOtpEmail =
  subject.toLowerCase().includes("otp") ||
  subject.toLowerCase().includes("verification");

const otp = isOtpEmail
  ? text.match(/\d{6}/)?.[0] || ""
  : "";
const certificateUrlMatch = text.match(/https?:\/\/[^\s]+/);
const certificateUrl = certificateUrlMatch?.[0] || "";
    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY || "",
        },
        body: JSON.stringify({
          sender: {
            name: "CollegeDocs",
            email: "noreply.collegedocs@gmail.com",
          },
          to: [
            {
              email: to,
              name: name,
            },
          ],
          subject,
          htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
  <div style="background:#2563eb;color:white;padding:15px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;">CollegeDocs Notification Center</h2>
  </div>

  <div style="border:1px solid #e5e7eb;padding:30px;border-radius:0 0 8px 8px;">
    <h3 style="margin-top:0;">Hello, ${name || "User"} 👋</h3>
    <p style="color:#6b7280;margin-bottom:20px;">
      This is an automated notification from CollegeDocs.
    </p>

    ${
      otp
        ? `
      <p><strong>Your One-Time Password (OTP) is:</strong></p>

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
      `
        : `
      <div style="
        background:#f8fafc;
        border-left:4px solid #2563eb;
        padding:16px;
        border-radius:8px;
        margin:20px 0;
        line-height:1.7;
        white-space:pre-line;
      ">
        ${text}
      </div>

      ${certificateUrl ? `
      <div style="text-align:center;margin-top:20px;">
        <a
          href="${certificateUrl}"
          target="_blank"
          style="
            display:inline-block;
            background:#2563eb;
            color:#ffffff;
            text-decoration:none;
            padding:12px 24px;
            border-radius:8px;
            font-weight:bold;
          "
        >
          📥 Download Certificate
        </a>
      </div>
      ` : ""}
      `
    }

    <hr style="margin:20px 0;" />

    <p style="font-size:12px;color:#6b7280;">
      © CollegeDocs - College Document Management System
    </p>
  </div>
</div>
`,
        }),
      }
    );

    const data = await response.json();

    console.log("📨 BREVO RESPONSE:", data);

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    return data;
  } catch (error) {
    console.error("❌ BREVO API ERROR:", error);
    throw error;
  }
};