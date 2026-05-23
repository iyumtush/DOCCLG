console.log("🔥 AUTH ROUTES LOADED");
import { sendEmail } from "../utils/sendEmail";
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * STUDENT REGISTER
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
   
   console.log("REGISTER BODY:", req.body);
   
   const { name, email, password, role, branch } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
  return res.status(400).json({ message: "User already exists" });
}

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
  data: {
    name,
    email,
    passwordHash: hashedPassword,
    role: role || "STUDENT",
    branch,
  },
});

try {
  await sendEmail(
    email,
    "Registration Successful",
    `Hello ${name},
Role: ${user.role}`
  );
} catch (err) {
  console.error("Email failed but user created:", err);
}
    return res.status(201).json({
      message: "Student registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * STUDENT LOGIN
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { name, email, password, role, branch } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role !== role) {
      return res.status(401).json({
        message: "Invalid role selected",
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, branch: user.branch },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * SEND OTP
 */
router.post("/send-otp", async (req, res) => {
  console.log("🔥 SEND OTP HIT");

  try {
    const { name, email, password, role, branch } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (user.role !== role) {
      return res.status(401).json({ message: "Invalid role selected" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otp, otpExpiry },
    });

    await sendEmail(
      email,
      "Your OTP Code",
      `Your OTP is: ${otp} It Expires In 5 Minutes`
    );

    return res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error sending OTP" });
  }
});

/**
 * VERIFY OTP
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpiry: null },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, branch: user.branch },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
});

/**
 * FORGOT PASSWORD
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { name, email, password, role, branch } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { email },
      data: { otp },
    });

    await sendEmail(email, "Reset Password OTP", `OTP: ${otp}`);

    return res.json({ message: "OTP sent" });

  } catch (err) {
    return res.status(500).json({ message: "Error" });
  }
});

/**
 * RESET PASSWORD
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
        otp: null,
      },
    });

    return res.json({ message: "Password updated" });

  } catch (err) {
    return res.status(500).json({ message: "Error" });
  }
});

/**
 * ✅ NEW: GET CURRENT USER (FIX REFRESH ISSUE)
 */
router.get("/me", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

export default router;