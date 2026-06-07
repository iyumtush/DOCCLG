import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth";
import requestsRoutes from "./routes/requests";
import { sendEmail } from "./utils/sendEmail";

dotenv.config();

const app = express(); 

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/requests", requestsRoutes);

const PORT = process.env.PORT || 4000;

sendEmail(
  "yourgmail@gmail.com",
  "Test Email",
  "If you receive this, email is working"
);

app.listen(PORT, () => {
  console.log(`Server running on https://docclg-backend.onrender.com`);
});

