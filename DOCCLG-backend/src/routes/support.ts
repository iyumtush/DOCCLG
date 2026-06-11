

import { Router } from "express";
import { sendEmail } from "../utils/sendEmail";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, title, description, screenshotUrl } = req.body;

    if (!name || !email || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (!supportEmail) {
      throw new Error("SUPPORT_EMAIL environment variable is not configured");
    }

    await sendEmail(
      supportEmail,
      `Support Request: ${title}`,
      `New Support Request Received

Name: ${name}
Email: ${email}
Issue Title: ${title}

Description:
${description}

${screenshotUrl ? `Screenshot: ${screenshotUrl}` : "No screenshot attached"}
`
    );

    return res.json({
      success: true,
      message: "Support request submitted successfully",
    });
  } catch (error) {
    console.error("Support request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit support request",
    });
  }
});

export default router;