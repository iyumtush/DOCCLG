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
    `This is to certify that ${studentName} has successfully completed all required approval stages for the issuance of a ${documentType}. This certificate has been generated through the CollegeDocs Digital Certificate Management System after verification and approval by the concerned authorities.` ,
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
  });

  const qrImage = await QRCode.toDataURL(qrData);
  const qrBase64 = qrImage.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrBase64, "base64");

  doc.image(qrBuffer, 220, 450, {
    width: 120,
  });

  doc.moveDown(10);

  doc.text("Verified & Approved Digitally", {
    align: "center",
  });

  doc.moveDown(2);

  doc.text("Principal", {
    align: "right",
  });

  doc.text("CollegeDocs Authority", {
    align: "right",
  });

  doc.moveDown(2);

  doc.fontSize(10).text(
    "This is a computer generated certificate. QR code can be used for verification.",
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