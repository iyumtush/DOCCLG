console.log("🔥 SERVER STARTED");
import express from "express";
import cors from "cors";
import dotenv from "dotenv";



import authRoutes from "./routes/auth";
import requestsRoutes from "./routes/requests";
import supportRoutes from "./routes/support";
import uploadRoutes from "./routes/upload";



import { PrismaClient } from "@prisma/client";
dotenv.config();

const prisma = new PrismaClient();

const app = express(); 
app.post("/test-otp", (req, res) => {
  console.log("🔥 TEST OTP HIT");
  res.json({ message: "Test OTP working" });
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("DOCCLG Backend Running ✅");
});

app.get("/api/stats", async (req, res) => {
  try {
    const students = await prisma.user.count({
      where: {
        role: "STUDENT",
      },
    });

    const faculty = await prisma.user.count({
      where: {
        role: {
          in: ["FACULTY", "CLASS_INCHARGE", "HOD"],
        },
      },
    });

    const documents = await prisma.request.count({
      where: {
        status: "HOD_APPROVED",
      },
    });

    res.json({
      students,
      faculty,
      documents,
    });
  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({
      students: 0,
      faculty: 0,
      documents: 0,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/upload", uploadRoutes);

const PORT = process.env.PORT || 4000;
 
import { sendEmail } from "./utils/sendEmail";

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
