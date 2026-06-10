import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { STATUS, ROLE } from "../lib/constants";
import { sendEmail } from "../utils/sendEmail";
import { generateCertificate } from "../utils/pdf/generateCertificate";

const router = Router();
const prisma = new PrismaClient();




const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

interface JwtPayload {
  userId: string;
  role: string;
}

/**
 * AUTH MIDDLEWARE
 */
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * GET requests (ROLE BASED FILTERING)
 */
router.get("/", authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let requests;

    // ================= STUDENT =================
    if (user.role === ROLE.STUDENT) {
      requests = await prisma.request.findMany({
        where: { studentId: user.id },
        include: { student: true },
        orderBy: { createdAt: "desc" },
      });
    }

    // ================= CLASS INCHARGE =================
    else if (user.role === ROLE.CLASS_INCHARGE) {
      requests = await prisma.request.findMany({
        where: {
          branch: user.branch,
          section: user.section,
        },
        include: { student: true },
        orderBy: { createdAt: "desc" },
      });
    }

    // ================= HOD =================
    else if (user.role === ROLE.HOD) {
      requests = await prisma.request.findMany({
        where: {
          branch: user.branch, // return all for counts + history
        },
        include: { student: true },
        orderBy: { createdAt: "desc" },
      });
    }

    // ✅ FORMAT RESPONSE (UNCHANGED)
    const formatted = (requests || []).map((r: any) => ({
      course: r.course || null,
        yearOfStudy: r.yearOfStudy || null,
        academicSession: r.academicSession || null,
        semester: r.semester || null,
        attendancePercentage: r.attendancePercentage || null,
        section: r.section || null,
      id: r.id,
      documentType: r.type,
      customDocumentName: null,
      purpose: r.reason,
      additionalDetails: null,
      status: r.status,

      createdAt: new Date(r.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),

      certificateId: r.certificateId || null,
      certificateUrl: r.certificateUrl || null,
      classInchargeComments: r.classInchargeComment || null,
      hodComments: r.hodComment || null,
      rejectionReason: r.rejectionReason || null,

      student: r.student,
    }));

    res.json({ requests: formatted });

  } catch (error: any) {
    console.error("GET ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * CREATE request (UNCHANGED)
 */
router.post("/", authenticate, async (req: any, res) => {
  try {
    const {
      documentType,
      purpose,
      course,
      yearOfStudy,
      academicSession,
      semester,
    } = req.body;
    const formattedDocumentType = documentType
      .toLowerCase()
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    if (
      !documentType ||
      !purpose ||
      !course ||
      !yearOfStudy ||
      !academicSession ||
      !semester
    ) {
      return res.status(400).json({
        message:
          "Document type, purpose, course, year of study, academic session and semester are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || !user.branch || !user.section) {
      return res.status(400).json({
        message: "User branch or section not set",
      });
    }

    const request = await prisma.request.create({
      data: {
        type: formattedDocumentType,
        reason: purpose,
        branch: user.branch,
        section: user.section,
        student: {
          connect: { id: user.id },
        },
        status: STATUS.PENDING,
        course,
        yearOfStudy,
        academicSession,
        semester,
      },
    });

    // 🔔 Notify Class Incharge
    const ciUsers = await prisma.user.findMany({
      where: {
        role: ROLE.CLASS_INCHARGE,
        branch: user.branch,
        section: user.section,
      },
    });

    await Promise.all(
  ciUsers.map((ci) =>
    sendEmail(
      ci.email,
      "New Request Submission Notification",
      `New Request Submission Notification

Dear Faculty,

A new request has been submitted through CollegeDocs.

Request Details:

• Document Type: ${documentType} Certificate
• Purpose: ${purpose}
• Course: ${course}
• Current Year: ${yearOfStudy}
• Academic Session: ${academicSession}
• Current Semester: ${semester}

Kindly log in to the CollegeDocs portal to review and take the necessary action.

Regards,
CollegeDocs Team`,
      ci.name || "Faculty"
    )
  )
);

    // 🔔 Notify Student (confirmation)
    await sendEmail(
      user.email,
      "Request Submitted Successfully",
      `Request Submission Confirmation

Dear Student,

Your request has been submitted successfully through CollegeDocs.

Request Details:

• Document Type: ${documentType} Certificate
• Purpose: ${purpose}
• Course: ${course}
• Current Year: ${yearOfStudy}
• Academic Session: ${academicSession}
• Current Semester: ${semester}
• Current Status: Pending

Your request is currently under review by the Class Incharge.

Regards,
CollegeDocs Team`,
      user.name || "Student"
    );

    res.status(201).json({ request });

  } catch (error: any) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * UPDATE request (2-LEVEL APPROVAL)
 */
router.patch("/:id", authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
const { attendancePercentage } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const request = await prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    let newStatus = request.status;

    // ================= CLASS INCHARGE =================
    if (user.role === "CLASS_INCHARGE") {
      if (request.status !== "PENDING") {
        return res.status(400).json({ message: "Already processed" });
      }

      newStatus = "CLASS_INCHARGE_APPROVED";
    }

    // ================= HOD =================
    else if (user.role === "HOD") {
      if (request.status !== "CLASS_INCHARGE_APPROVED") {
        return res.status(400).json({ message: "Not ready for HOD approval" });
      }

      newStatus = "HOD_APPROVED";
    }

    // ================= REJECT =================
    if (req.body.status === "REJECTED") {
      newStatus = "REJECTED";
    }

    const updateData: any = {
  status: newStatus,
};

if (
  user.role === ROLE.CLASS_INCHARGE &&
  request.type.toUpperCase().includes("ATTENDANCE")
) {
  if (
    attendancePercentage === undefined ||
    attendancePercentage === ""
  ) {
    return res.status(400).json({
      message: "Attendance percentage is required",
    });
  }

  updateData.attendancePercentage = Number(attendancePercentage);
}

const updated = await prisma.request.update({
  where: { id },
  data: updateData,
});

    // 🔔 Fetch student
    const student = await prisma.user.findUnique({
      where: { id: request.studentId },
    });

    // 🔔 Notify based on status
    if (newStatus === "CLASS_INCHARGE_APPROVED") {
      // notify HOD
      const hods = await prisma.user.findMany({
        where: {
          role: ROLE.HOD,
          branch: request.branch,
        },
      });
await Promise.all(
  hods.map((hod) =>
    sendEmail(
      hod.email,
      "Request Pending for Approval",
      `Request Pending for Approval

Dear HOD,

A request has been reviewed and approved by the Class Incharge and is now pending for your approval.

Request Details:

• Document Type: ${request.type} Certificate
• Purpose: ${request.reason}
• Course: ${request.course}
• Current Year: ${request.yearOfStudy}
• Academic Session: ${request.academicSession}
• Current Semester: ${request.semester}
${updated.attendancePercentage
  ? `• Attendance Percentage: ${updated.attendancePercentage}%`
  : ""}
• Current Status: Waiting for HOD Approval

Please log in to the CollegeDocs portal to review and proceed with the approval process.

Regards,
CollegeDocs Team`,
      hod.name || "HOD"
    )
  )
);

      // 🔔 Notify Student (CI approved)
      if (newStatus === "CLASS_INCHARGE_APPROVED" && student) {
        await sendEmail(
          student.email,
          "Request Approved by Class Incharge",
          `Request Approved by Class Incharge

Dear Student,

Your request has been approved by the Class Incharge and forwarded for final approval.

Request Details:

• Document Type: ${request.type} Certificate
• Current Status: Approved by Class Incharge

You will receive another notification once the HOD completes the final approval process.

Regards,
CollegeDocs Team`,
          student.name || "Student"
        );
      }
    }

    if (newStatus === "HOD_APPROVED") {
      const certificateId = `DOC-${new Date().getFullYear()}-${Date.now()}`;

      let certificateUrl: string | undefined;

      try {
        if (student) {
          certificateUrl = await generateCertificate({
  studentName: student.name || "Student",
  documentType: request.type,
  certificateId,
  requestId: request.id,

  course: request.course || "",
  branch: student.branch || "",
  yearOfStudy: request.yearOfStudy || "",
  academicSession: request.academicSession || "",
  semester: request.semester || "",
  attendancePercentage: updated.attendancePercentage || undefined,
});

          await prisma.request.update({
            where: { id: request.id },
            data: {
              certificateId,
              ...(certificateUrl ? { certificateUrl } : {}),
            },
          });
        }
      } catch (pdfError) {
        console.error("PDF GENERATION ERROR:", pdfError);
      }

      // notify student
      if (student) {
        await sendEmail(
          student.email,
          "Request Approved",
          `Request Approved

Dear Student,

We are pleased to inform you that your request has been approved successfully.

Request Details:

• Document Type: ${request.type} Certificate
• Course: ${request.course || 'N/A'}
• Current Year: ${request.yearOfStudy || 'N/A'}
• Current Semester: ${request.semester || 'N/A'}
• Academic Session: ${request.academicSession || 'N/A'}
• Current Status: Approved
${certificateId ? `• Certificate ID: ${certificateId}\n` : ""}

Your certificate is now ready for download.

${certificateUrl ? `${certificateUrl}\n` : ""}

Please log in to the CollegeDocs portal for further actions and status tracking.

Regards,
CollegeDocs Team`,
          student.name || "Student"
        );
      }
    }

    if (newStatus === "REJECTED") {
      if (student) {
        await sendEmail(
          student.email,
          "Request Rejected",
          `Request Rejected

Dear Student,

We regret to inform you that your request has been rejected.

Request Details:

• Document Type: ${request.type} Certificate
• Current Status: Rejected

Please log in to the CollegeDocs portal for further details regarding your request.

Regards,
CollegeDocs Team`,
          student.name || "Student"
        );
      }
    }

    res.json({ request: updated });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;