// @ts-nocheck
import { Router } from "express";
import multer from "multer";
import { createHash } from "crypto";
import { mkdirSync } from "fs";
import { join } from "path";
import { requireAuth } from "../middleware/auth";

export const UPLOAD_DIR = join(process.cwd(), "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const hash = createHash("sha1")
      .update(Date.now().toString() + file.originalname)
      .digest("hex")
      .slice(0, 14);
    const ext = (file.originalname.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    cb(null, `${hash}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const router = Router();

router.post("/v1/upload/image", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file received" });
    return;
  }

  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() ?? "http";
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers["host"];
  const url = `${proto}://${host}/uploads/${req.file.filename}`;

  res.json({ url, filename: req.file.filename });
});

export default router;
