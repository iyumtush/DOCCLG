console.log("🔥 SERVER STARTED");
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import requestsRoutes from "./routes/requests";

dotenv.config();

const app = express(); 
app.post("/test-otp", (req, res) => {
  console.log("🔥 TEST OTP HIT");
  res.json({ message: "Test OTP working" });
});

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/requests", requestsRoutes);

const PORT = process.env.PORT || 4000;
 
import { sendEmail } from "./utils/sendEmail";

sendEmail(
  "yourgmail@gmail.com",
  "Test Email",
  "If you receive this, email is working"
);

app.listen(PORT, () => {
  console.log(`Server running on https://docclg-backend.onrender.com }`);
});

