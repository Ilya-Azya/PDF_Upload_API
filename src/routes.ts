import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import {
  downloadFile,
  listFiles,
  uploadFile,
  uploadsDirectory,
} from "./controllers";

const INVALID_FILE_TYPE_ERROR = "INVALID_FILE_TYPE";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDirectory),
    filename: (_req, _file, cb) => cb(null, `${uuidv4()}.pdf`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error(INVALID_FILE_TYPE_ERROR));
      return;
    }

    cb(null, true);
  },
});

export const router = Router();

router.post("/upload", (req, res) => {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ error: "File too large. Maximum size is 10 MB." });
        return;
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400).json({ error: 'Unexpected file field. Use "file".' });
        return;
      }
    }

    if (error instanceof Error && error.message === INVALID_FILE_TYPE_ERROR) {
      res.status(400).json({ error: "Only PDF files are allowed." });
      return;
    }

    if (error) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    uploadFile(req, res);
  });
});

router.get("/files", listFiles);
router.get("/files/:id/download", downloadFile);
