import path from "path";
import fs from "fs";
import qrcode from "qrcode";
import { sendMail } from "./mailer";
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
export async function generateAndSendCertificate(reqRecord: any, student: any) {
  const certId = reqRecord.certificateId;
  const qrDataUrl = await qrcode.toDataURL(certId);
  const html = `
    <div style="font-family: Arial; text-align:center; padding:40px;">
      <h1>College Certificate</h1>
      <p>Certificate ID: ${certId}</p>
      <p>Name: ${student?.name}</p>
      <p>Type: ${reqRecord.type}</p>
      <p>Issued: ${new Date().toLocaleDateString()}</p>
      <div><img src="${qrDataUrl}" style="height:100px" /></div>
    </div>
  `;
  const pdfPath = path.join(uploadsDir, `${certId}.pdf`);
  try {
    const pdf = require("html-pdf");
    await new Promise((resolve, reject) => {
      pdf.create(html, { format: "A4" }).toFile(pdfPath, (err: any) => (err ? reject(err) : resolve(null)));
    });
  } catch (e) {
    fs.writeFileSync(path.join(uploadsDir, `${certId}.html`), html, "utf-8");
  }
  const attachments = [];
  if (fs.existsSync(pdfPath)) attachments.push({ filename: `${certId}.pdf`, path: pdfPath });
  await sendMail({
    from: process.env.SMTP_FROM,
    to: student?.email,
    subject: `Your certificate ${certId}`,
    html: `<p>Dear ${student?.name}, your certificate is attached.</p>`,
    attachments
  });
}
