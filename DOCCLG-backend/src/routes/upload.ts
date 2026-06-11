import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

if (!file) {
  return res.status(400).json({
    success: false,
    message: "No file uploaded",
  });
}

const fileBuffer = file.buffer;

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "collegedocs/support",
            resource_type: "image",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        )
        .end(fileBuffer);
    });

    return res.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload file",
    });
  }
});

export default router;