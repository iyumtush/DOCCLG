

import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import cloudinary from "../../config/cloudinary";

interface GenerateCertificateParams {
  studentName: string;
  documentType: string;
  certificateId: string;
  requestId: string;
}

export const generateCertificate = async ({
  studentName,
  documentType,
  certificateId,
  requestId,
}: GenerateCertificateParams): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), "uploads", "certificates");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `${certificateId}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(22).text("COLLEGEDOCS", {
    align: "center",
  });

  doc.moveDown();

  doc.fontSize(18).text(`${documentType.toUpperCase()} CERTIFICATE`, {
    align: "center",
  });

  doc.moveDown(2);

  doc.fontSize(12).text(`Certificate ID: ${certificateId}`);
  doc.text(`Request ID: ${requestId}`);
  doc.text(`Issue Date: ${new Date().toLocaleDateString()}`);

  doc.moveDown(2);

  doc.fontSize(14).text(
    `This is to certify that ${studentName} has successfully completed the approval process for ${documentType}.`,
    {
      align: "justify",
    }
  );

  doc.moveDown(3);

  const qrData = JSON.stringify({
    certificateId,
    requestId,
    studentName,
  });

  const qrImage = await QRCode.toDataURL(qrData);
  const qrBase64 = qrImage.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrBase64, "base64");

  doc.image(qrBuffer, 220, 450, {
    width: 120,
  });

  doc.moveDown(8);

  doc.text("Authorized Signature", {
    align: "right",
  });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  const uploadResult = await cloudinary.uploader.upload(filePath, {
    resource_type: "raw",
    folder: "certificates",
    public_id: certificateId,
  });

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return uploadResult.secure_url;
};