console.log("🔥 SERVER STARTED");
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth";
import requestsRoutes from "./routes/requests";

dotenv.config();

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
app.use(
  "/certificates",
  express.static(path.join(process.cwd(), "uploads", "certificates"))
);

app.get("/", (req, res) => {
  res.send("DOCCLG Backend Running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestsRoutes);

const PORT = process.env.PORT || 4000;
 
import { sendEmail } from "./utils/sendEmail";

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
