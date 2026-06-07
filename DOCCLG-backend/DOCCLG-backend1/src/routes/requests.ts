import { Router } from "express";
import authMiddleware from "./_auth";
import { prisma } from "../prisma";
import { v4 as uuidv4 } from "uuid";
import { generateAndSendCertificate } from "../services/cert-generator";
const router = Router();
router.post("/", authMiddleware, async (req: any, res) => {
  const user = req.user;
  const { type, details } = req.body;
  const r = await prisma.request.create({
    data: {
      studentId: user.userId,
      type,
      details,
    }
  });
  res.json(r);
});
router.post("/:id/incharge-approve", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
const { attendancePercentage } = req.body;
  const user = req.user;
  const r = await prisma.request.update({
    where: { id },
    data: { status: "APPROVED_BY_INCHARGE", classInchargeId: user.userId }
  });
  res.json(r);
});
router.post("/:id/hod-approve", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
const { attendancePercentage } = req.body;
  const user = req.user;
  const certId = uuidv4();
  const r = await prisma.request.update({
    where: { id },
    data: { status: "APPROVED", hodId: user.userId, certificateId: certId, issuedAt: new Date() }
  });
  const student = await prisma.user.findUnique({ where: { id: r.studentId } });
  await generateAndSendCertificate(r, student);
  res.json({ success: true, request: r });
});
router.post("/:id/reject", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
const { attendancePercentage } = req.body;
  const { reason } = req.body;
  const r = await prisma.request.update({
    where: { id },
    data: { status: "REJECTED", rejectReason: reason }
  });
  res.json(r);
});
router.get("/", authMiddleware, async (req: any, res) => {
  const user = req.user;
  if (user.role === "STUDENT") {
    const items = await prisma.request.findMany({ where: { studentId: user.userId }, orderBy: { createdAt: "desc" } });
    return res.json(items);
  } else {
    const items = await prisma.request.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(items);
  }
});
export default router;
