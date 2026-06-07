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
  course?: string;
  yearOfStudy?: string;
  academicSession?: string;
  semester?: string;
  
attendancePercentage?: number | undefined;
}

export const generateCertificate = async ({
  studentName,
  documentType,
  certificateId,
  requestId,
  course,
  yearOfStudy,
  academicSession,
  semester,
  attendancePercentage,
}: GenerateCertificateParams): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), "uploads", "certificates");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `${certificateId}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const formattedDocumentType =
    documentType.charAt(0).toUpperCase() +
    documentType.slice(1).toLowerCase();

  console.log("GENERATING PDF:", filePath);

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.lineWidth(2);
  doc.rect(20, 20, 555, 800).stroke('black');
  doc.lineWidth(1);
  doc.rect(28, 28, 539, 784).stroke('black');

  doc.fontSize(34).fillColor('#1f2f6b').text('COLLEGEDOCS', {
    align: 'center',
  });

  doc.fontSize(16).fillColor('black').text('College Document Management System', {
    align: 'center',
  });

  // Removed colored horizontal line at y=125

  doc.moveDown(0.5);

  doc.fontSize(28).fillColor('#1f2f6b').text(`${formattedDocumentType} Certificate`, {
    align: 'center',
  });

  doc.moveDown(0.3);
  // Removed colored horizontal line at y=190
  doc.fillColor('black');

  doc.moveDown(2);

  doc.fontSize(12).text(`Certificate ID: ${certificateId}`);
  doc.text(`Request ID: ${requestId}`);
  doc.text(`Issue Date: ${new Date().toLocaleDateString()}`);
  doc.text(`Student Name: ${studentName}`);
  doc.text(`Document Type: ${formattedDocumentType}`);
  if (course) doc.text(`Course: ${course}`);
  if (yearOfStudy) doc.text(`Current Year: ${yearOfStudy}`);
  if (semester) doc.text(`Current Semester: ${semester}`);
  if (academicSession) doc.text(`Academic Session: ${academicSession}`);
  if (attendancePercentage !== undefined)
    doc.text(`Attendance Percentage: ${attendancePercentage}%`);

  doc.moveDown(2);

  doc.fontSize(16).text("TO WHOMSOEVER IT MAY CONCERN", {
    align: "center",
    underline: true,
  });

  doc.moveDown();

  const isAttendanceCertificate =
    documentType.toUpperCase().includes("ATTENDANCE");

  const certificateContent = isAttendanceCertificate
    ? `This is to certify that ${studentName} is a bonafide student of ${course || 'the institution'} and is currently studying in ${yearOfStudy || 'the current year'} ${semester ? `(${semester})` : ''} during the academic session ${academicSession || ''}. The student's attendance for the said academic session is ${attendancePercentage ?? 'N/A'}%. This certificate is issued on the student's request for official purposes.`
    : `This is to certify that ${studentName} is a bonafide student of ${course || 'the institution'}, currently studying in ${yearOfStudy || 'the current year'} ${semester ? `(${semester})` : ''} during the academic session ${academicSession || ''}. This certificate has been generated through the CollegeDocs Digital Documents Management System after verification and approval by the concerned authorities.`;

  doc.fontSize(14).text(certificateContent, {
    align: "justify",
  });

  doc.moveDown();

  doc.text(
    `Certificate Reference Number: ${certificateId}. This document may be verified using the QR code provided below.` ,
    {
      align: "justify",
    }
  );

  doc.moveDown(3);

  const certificateUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/certificates/${certificateId}.pdf`;

  const qrData = certificateUrl;

  const qrImage = await QRCode.toDataURL(qrData);
  const qrBase64 = qrImage.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrBase64, "base64");

  // QR bottom-left like reference design
  doc.image(qrBuffer, 50, 700, {
    width: 45,
  });

  doc.fontSize(8);
  doc.text('Verification ID:', 50, 750, {
    width: 110,
    align: 'left',
  });

  doc.text(certificateId, 50, 762, {
    width: 120,
    align: 'left',
  });

  // Keep approval mark below authority text with proper spacing


 doc.fontSize(8);

// Keep both words together and centered
const verifyY = 755;

doc.fillColor('green');
doc.text('Verified', 390, verifyY, {
  continued: true,
});

doc.fillColor('#1f2f6b');
doc.text(' & Approved Digitally', {
  continued: false,
});

doc.fillColor('black');

  // Principal signature centered below line
  doc.moveTo(360, 690)
     .lineTo(520, 690)
     .stroke();

  doc.font('Helvetica-Bold');
  doc.fontSize(14);
  doc.text('Principal', 360, 698, {
    width: 160,
    align: 'center',
  });

  doc.font('Helvetica');
  doc.fontSize(11);
  doc.text('CollegeDocs Authority', 360, 722, {
    width: 160,
    align: 'center',
  });

  // Do not move down here; it can force the footer onto a second page.

  // Fixed footer inside page border
  doc.fontSize(7);
  doc.fillColor('gray');
  doc.text(
    'This is a computer generated certificate. QR code can be used for verification.',
    60,
    770,
    {
      width: 480,
      align: 'center',
      lineBreak: false,
    }
  );
  doc.fillColor('black');

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

  console.log('QR URL:', certificateUrl);
  console.log('FINAL PDF URL:', uploadResult.secure_url);

  console.log("PDF UPLOADED:", uploadResult.secure_url);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return uploadResult.secure_url;
};