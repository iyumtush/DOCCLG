import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import cloudinary from "../../config/cloudinary";
import QRCode from "qrcode";

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

  console.log("GENERATING PDF:", filePath);

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.rect(30, 30, 535, 750).stroke();

  doc.fontSize(24).text("COLLEGEDOCS", {
    align: "center",
  });

  doc.fontSize(12).text("College Document Management System", {
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
  doc.text(`Student Name: ${studentName}`);
  doc.text(`Document Type: ${documentType}`);

  doc.moveDown(2);

  doc.fontSize(16).text("TO WHOMSOEVER IT MAY CONCERN", {
    align: "center",
    underline: true,
  });

  doc.moveDown();

  doc.fontSize(14).text(
    `This is to certify that ${studentName} has successfully completed all required approval stages for the issuance of a ${documentType} Certificate. This certificate has been generated through the CollegeDocs Digital Certificate Management System after verification and approval by the concerned authorities.` ,
    {
      align: "justify",
    }
  );

  doc.moveDown();

  doc.text(
    `Certificate Reference Number: ${certificateId}. This document may be verified using the QR code provided below.` ,
    {
      align: "justify",
    }
  );

  doc.moveDown(3);

  const qrData = JSON.stringify({
    certificateId,
    requestId,
    studentName,
    documentType,
  });

  const qrImage = await QRCode.toDataURL(qrData);
  const qrBase64 = qrImage.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrBase64, "base64");

  // Small QR in bottom-left corner
  doc.image(qrBuffer, 60, 610, {
    width: 70,
  });

  doc.fontSize(9);
  doc.text("Verification ID:", 60, 690, {
    width: 120,
    align: "left",
  });

  doc.text(certificateId, 60, 705, {
    width: 140,
    align: "left",
  });

  // Digital approval section
  doc.fontSize(12);
  doc.text("────────────────────", 180, 540, {
    align: "center",
  });

  doc.text("Verified & Approved Digitally", 0, 560, {
    align: "center",
  });

  doc.text("────────────────────", 180, 580, {
    align: "center",
  });

  // Principal signature block centered
  doc.fontSize(12);
  doc.text("_________________________", 0, 665, {
    align: "center",
  });

  doc.font('Helvetica-Bold');
  doc.text("Principal", 0, 690, {
    align: "center",
  });

  doc.font('Helvetica');
  doc.text("CollegeDocs Authority", 0, 710, {
    align: "center",
  });

  doc.moveDown(2);

  doc.fontSize(10).text(
    "This is a computer generated certificate. QR code can be used for verification.",
    0,
    755,
    {
      align: "center",
    }
  );

  console.log("WRITING PDF CONTENT...");

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  const stats = fs.statSync(filePath);
  console.log("PDF SIZE:", stats.size, "bytes");

  if (stats.size === 0) {
    throw new Error("Generated PDF is empty");
  }

  const uploadResult = await cloudinary.uploader.upload(filePath, {
    resource_type: "raw",
    folder: "certificates",
    public_id: certificateId,
    overwrite: true,
  });

  console.log("PDF UPLOADED:", uploadResult.secure_url);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return uploadResult.secure_url;
};