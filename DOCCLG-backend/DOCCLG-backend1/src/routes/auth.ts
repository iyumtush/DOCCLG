import { Router } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
router.post("/register", async (req, res) => {
  const { name, email, password, collegeId } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email/password required" });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ error: "User exists" });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash: hash, collegeId } });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
export default router;
