import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { config } from "./config";
import { storage } from "./storage";
import { FileMetadata } from "./types";

export const uploadsDirectory = config.uploadsDirectory;
fs.mkdirSync(uploadsDirectory, { recursive: true });

export function uploadFile(req: Request, res: Response): void {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }

  const metadata: FileMetadata = {
    id: path.parse(req.file.filename).name,
    originalName: req.file.originalname,
    filenameOnDisk: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  };

  storage.add(metadata);
  res.status(201).json({ id: metadata.id, originalName: metadata.originalName });
}

export function listFiles(_req: Request, res: Response): void {
  res.json(storage.getAll().map((file) => ({ id: file.id, name: file.originalName })));
}

export function downloadFile(req: Request, res: Response): void {
  const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const file = storage.getById(fileId);

  if (!file) {
    res.status(404).json({ error: "File not found." });
    return;
  }

  const filePath = path.join(uploadsDirectory, file.filenameOnDisk);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found on disk." });
    return;
  }

  res.download(filePath, file.originalName);
}
