import * as SibApiV3Sdk from "@getbrevo/brevo";

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  name: string = "User"
) => {
  try {
    console.log("📧 USING BREVO API");
    console.log("📨 RECIPIENT:", to);

    const otp = text.match(/\d{6}/)?.[0] || "";

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY || ""
    );

    const result = await apiInstance.sendTransacEmail({
      sender: {
        name: "CollegeDocs",
        email: "noreply@brevo.com",
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
    <h2 style="margin:0;">CollegeDocs Verification</h2>
  </div>

  <div style="border:1px solid #e5e7eb;padding:30px;border-radius:0 0 8px 8px;">
    <h3>Hello, ${name || "User"} 👋</h3>

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

    <hr />

    <p style="font-size:12px;color:#6b7280;">
      © CollegeDocs
    </p>
  </div>
</div>
`,
    });

    console.log("✅ BREVO EMAIL SENT:", result);
    return result;
  } catch (error) {
    console.error("❌ BREVO ERROR:", error);
    throw error;
  }
};