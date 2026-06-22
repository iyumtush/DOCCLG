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
  branch?: string;
  yearOfStudy?: string;
  academicSession?: string;
  semester?: string;
  attendancePercentage?: number | undefined;
  purpose?: string;
}

// Helper to write inline bold text using $$ markers
const writeFormattedText = (
  doc: any,
  text: string,
  options: { align?: string; width?: number; lineGap?: number },
  baseFont: string = 'Helvetica',
  boldFont: string = 'Helvetica-Bold'
) => {
  const parts = text.split("$$");
  for (let i = 0; i < parts.length; i++) {
    const isBold = i % 2 !== 0;
    doc.font(isBold ? boldFont : baseFont);
    doc.text(parts[i], {
      continued: i < parts.length - 1,
      ...options
    });
  }
};

export const generateCertificate = async ({
  studentName,
  documentType,
  certificateId,
  requestId,
  course,
  branch,
  yearOfStudy,
  academicSession,
  semester,
  attendancePercentage,
  purpose,
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
    margin: 40,
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Outer Page Borders (Double Border Maroon #800000)
  doc.lineWidth(2.5);
  doc.rect(20, 20, 555, 800).stroke('#800000');
  doc.lineWidth(0.8);
  doc.rect(24, 24, 547, 792).stroke('#800000');

  // Top Left Banner
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('black');
  doc.text('Grade - A', 35, 35, { width: 80, align: 'center' });

  // Top Left Logo image (uploads/logo.png) with manual fallback
  const logoPath = path.join(process.cwd(), "uploads", "logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 48, { width: 50 });
  } else {
    // Stylized Engineering Shield/Triangle Logo (Estd: 1984) Fallback
    doc.lineWidth(1.5);
    doc.strokeColor('#1f2f6b');
    doc.moveTo(75, 47).lineTo(95, 80).lineTo(55, 80).closePath().stroke();
    doc.moveTo(75, 47).lineTo(75, 80).stroke();
    doc.lineWidth(1.0);
    doc.moveTo(62, 65).lineTo(88, 65).stroke();
  }

  doc.fillColor('black');
  doc.font('Helvetica-Bold').fontSize(8.5).text('Estd : 1984', 35, 103, { width: 80, align: 'center' });

  // Top Right Banner
  doc.font('Helvetica-Bold').fontSize(8.5).text('D.T.E.', 480, 35, { width: 80, align: 'center' });
  doc.font('Helvetica').fontSize(8).text('College Code', 480, 47, { width: 80, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(9).text('4147', 480, 59, { width: 80, align: 'center' });

  // Center Header Texts & Rounded Box
  doc.font('Helvetica-BoldOblique').fontSize(8).fillColor('black').text("Backward Class Youth Relief Committee's", 120, 32, { width: 355, align: 'center' });

  doc.lineWidth(1.2);
  doc.strokeColor('black');
  doc.roundedRect(120, 43, 355, 47, 4).stroke();

  doc.font('Times-Bold').fontSize(16).fillColor('#800000').text('K. D. K. COLLEGE OF ENGINEERING', 120, 48, { width: 355, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('black').text('Great Nag Road, Nandanvan, Nagpur – 440024.', 120, 65, { width: 355, align: 'center' });
  doc.fontSize(8.5).fillColor('#0000ff').text('(An Autonomous Institute w.e.f. 2024-25)', 120, 77, { width: 355, align: 'center' });

  // Accreditation & Affiliation Row details below box
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#800000').text('Accredited by NAAC & NBA (5 Programs)', 120, 94, { width: 355, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#006400').text('Approved by AICTE New Delhi, Directorate of Technical Education, M.S. Mumbai', 120, 105, { width: 355, align: 'center' });
  doc.text('& Affiliated to R.T.M. Nagpur University, Nagpur.', 120, 114, { width: 355, align: 'center' });

  doc.font('Helvetica').fontSize(7).fillColor('black').text('Ph.No. : (0712) 2711400, 2711030, Fax : (0712) 2713658', 120, 124, { width: 355, align: 'center' });
  doc.font('Helvetica').fontSize(7).text('Email : kdkce4147@gmail.com; Web Site : www.kdkce.edu.in', 120, 133, { width: 355, align: 'center' });

  // Officer Row (Principal & Vice Principal titles)
  doc.font('Helvetica-Bold').fontSize(9.5).text('Dr. Valsson P. Varghese', 40, 150, { width: 200, align: 'left' });
  doc.font('Helvetica').fontSize(9).text('Principal', 40, 162, { width: 200, align: 'left' });

  doc.font('Helvetica-Bold').fontSize(9.5).text('Dr. Avinash M. Badar', 355, 150, { width: 200, align: 'right' });
  doc.font('Helvetica').fontSize(9).text('Vice Principal', 355, 162, { width: 200, align: 'right' });

  // Double Divider line below officer row
  doc.lineWidth(1.5).strokeColor('#800000').moveTo(40, 174).lineTo(555, 174).stroke();
  doc.lineWidth(0.5).strokeColor('#800000').moveTo(40, 176).lineTo(555, 176).stroke();

  // Center Vision statement bounded by single lines
  doc.lineWidth(0.8).strokeColor('#800000').moveTo(40, 182).lineTo(555, 182).stroke();
  doc.font('Helvetica-BoldOblique').fontSize(8.5).fillColor('#0000ff').text('VISION : Service to the Society Through Quality Technical Education', 40, 186, { width: 515, align: 'center' });
  doc.lineWidth(0.8).strokeColor('#800000').moveTo(40, 198).lineTo(555, 198).stroke();

  // Dynamic Ref No and Date Row
  const formattedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  let formattedSession = academicSession || "2024-25";
  if (formattedSession.includes("-") && formattedSession.length === 9) {
    const parts = formattedSession.split("-");
    if (parts[0] && parts[1]) {
      formattedSession = `${parts[0]}-${parts[1].slice(-2)}`;
    }
  }
  const idParts = certificateId.split("-");
  const shortId = idParts[idParts.length - 1] || certificateId;
  const refNo = `Ref. No.: KDKCE/${formattedDocumentType}/${shortId}/${formattedSession}`;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('black').text(refNo, 40, 206, { width: 350, align: 'left' });
  doc.text(`Date : ${formattedDate}`, 355, 206, { width: 200, align: 'right' });

  doc.lineWidth(1.5).strokeColor('#800000').moveTo(40, 222).lineTo(555, 222).stroke();

  // Document Title & Subtitle
  let titleText = documentType.toUpperCase();
  if (!titleText.endsWith("CERTIFICATE")) {
    titleText = `${titleText} CERTIFICATE`;
  }
  doc.font('Times-Bold').fontSize(18).fillColor('black').text(titleText, 40, 260, {
    width: 515,
    align: 'center',
    underline: true
  });

  doc.font('Times-Bold').fontSize(12).text('(TO WHOMSOEVER IT MAY CONCERN)', 40, 282, {
    width: 515,
    align: 'center',
    underline: true
  });

  // Body Paragraphs
  const isAttendanceCertificate = documentType.toUpperCase().includes("ATTENDANCE");
  const studentTitle = studentName.startsWith("Mr.") || studentName.startsWith("Ms.") || studentName.startsWith("Mrs.")
    ? studentName
    : `Mr./Ms. ${studentName}`;

  let fullSession = academicSession || "2024-2025";
  if (!fullSession.includes("-")) {
    fullSession = "2024-2025";
  } else if (fullSession.length === 7) {
    const parts = fullSession.split("-");
    fullSession = `${parts[0]}-20${parts[1]}`;
  }

  const formattedBranch = branch || "Engineering";
  const formattedCourse = course || "B.Tech.";
  const courseYearText = `${formattedCourse} ${yearOfStudy || "1st"} year (${formattedBranch})`;

  const p1 = isAttendanceCertificate
    ? `This is to certify that $$${studentTitle} $$is a bonafide student of this institution and is a student of $$${courseYearText} $$for the session $$${fullSession}$$. The student's attendance for the semester $$${semester || "1st"} $$is $$${attendancePercentage ?? "N/A"}%$$.`
    : `This is to certify that $$${studentTitle} $$is a bonafide student of this institution and is a student of $$${courseYearText} $$for the session $$${fullSession}$$.`;

  const p2 = `This certificate is being issued on his/her own request.`;

  doc.x = 40;
  doc.y = 330;
  writeFormattedText(doc, p1, { width: 515, align: 'justify', lineGap: 7 }, 'Times-Roman', 'Times-Bold');

  doc.moveDown(1.5);
  writeFormattedText(doc, p2, { width: 515, align: 'left' }, 'Times-Roman', 'Times-Bold');

  // Verification Area (Bottom Left)
  const certificateUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/certificates/${certificateId}.pdf`;
  const qrImage = await QRCode.toDataURL(certificateUrl);
  const qrBase64 = qrImage.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrBase64, "base64");

  doc.image(qrBuffer, 45, 680, {
    width: 50,
  });

  doc.fontSize(7);
  doc.fillColor('gray');
  doc.font('Helvetica').text('Verification ID:', 45, 735, { width: 180 });
  doc.fillColor('black');
  doc.font('Helvetica-Bold').text(certificateId, 45, 745, { width: 180 });

  // Digitally Verified Badge
  doc.fillColor('green');
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text('Verified', 110, 690, { continued: true });
  doc.fillColor('#0000ff');
  doc.text(' & Approved Digitally', { continued: false });

  doc.fillColor('gray');
  doc.font('Helvetica').fontSize(7);
  doc.text('Signed digitally via CollegeDocs system.', 110, 703, { width: 220 });

  // Principal Signature Block (Bottom Right)
  const signaturePath = path.join(process.cwd(), "uploads", "signature_stamp.png");
  const fallbackSignaturePath = path.join(process.cwd(), "uploads", "msdsign.png");
  const actualSignaturePath = fs.existsSync(signaturePath) ? signaturePath : fallbackSignaturePath;

  if (fs.existsSync(actualSignaturePath)) {
    doc.image(actualSignaturePath, 400, 585, {
      width: 100,
    });
  }

  doc.lineWidth(1).strokeColor('black');
  doc.moveTo(370, 685).lineTo(530, 685).stroke();

  doc.font('Helvetica-Bold').fontSize(11).fillColor('black').text('PRINCIPAL', 370, 692, {
    width: 160,
    align: 'center',
  });
  doc.text('KDKCE, NAGPUR', 370, 705, {
    width: 160,
    align: 'center',
  });

  // Footer Disclaimer
  doc.font('Helvetica').fontSize(7).fillColor('gray');
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

  if (fs.existsSync(filePath) && !certificateId.startsWith("TEST-")) {
    fs.unlinkSync(filePath);
  }

  return uploadResult.secure_url;
};