import fs from "fs";
import path from "path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { uploadsDirectory } from "../src/controllers";
import { storage } from "../src/storage";

const samplePdfPath = path.join(uploadsDirectory, "sample-test.pdf");
const sampleTxtPath = path.join(uploadsDirectory, "sample-test.txt");
const largePdfPath = path.join(uploadsDirectory, "large-test.pdf");

function cleanupUploads(): void {
  if (!fs.existsSync(uploadsDirectory)) {
    return;
  }

  for (const entry of fs.readdirSync(uploadsDirectory)) {
    fs.rmSync(path.join(uploadsDirectory, entry), { force: true });
  }
}

beforeEach(() => {
  storage.clear();
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  fs.writeFileSync(samplePdfPath, "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
  fs.writeFileSync(sampleTxtPath, "plain text");
  fs.writeFileSync(largePdfPath, Buffer.alloc(10 * 1024 * 1024 + 1, 0));
});

afterEach(() => {
  cleanupUploads();
  storage.clear();
});

describe("PDF upload API", () => {
  it("uploads a PDF and returns metadata payload", async () => {
    const response = await request(app).post("/upload").attach("file", samplePdfPath);

    expect(response.status).toBe(201);
    expect(response.body.originalName).toBe("sample-test.pdf");
    expect(response.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const filesOnDisk = fs.readdirSync(uploadsDirectory);
    expect(filesOnDisk).toContain(`${response.body.id}.pdf`);
  });

  it("rejects non-PDF files", async () => {
    const response = await request(app).post("/upload").attach("file", sampleTxtPath);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Only PDF files are allowed." });
  });

  it("rejects files larger than 10 MB", async () => {
    const response = await request(app).post("/upload").attach("file", largePdfPath);

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "File too large. Maximum size is 10 MB." });
  });

  it("rejects requests without a file", async () => {
    const response = await request(app).post("/upload");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "No file uploaded." });
  });

  it('rejects unexpected multipart field names', async () => {
    const response = await request(app).post("/upload").attach("document", samplePdfPath);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Unexpected file field. Use "file".' });
  });

  it("lists uploaded files", async () => {
    const uploadResponse = await request(app).post("/upload").attach("file", samplePdfPath);

    const response = await request(app).get("/files");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: uploadResponse.body.id, name: "sample-test.pdf" },
    ]);
  });

  it("downloads an uploaded file by id", async () => {
    const uploadResponse = await request(app).post("/upload").attach("file", samplePdfPath);

    const response = await request(app).get(`/files/${uploadResponse.body.id}/download`);

    expect(response.status).toBe(200);
    expect(response.header["content-type"]).toContain("application/pdf");
    expect(response.header["content-disposition"]).toContain("sample-test.pdf");
  });

  it("returns 404 for unknown file id", async () => {
    const response = await request(app).get("/files/missing-id/download");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "File not found." });
  });

  it("returns 404 when metadata exists but the file is missing on disk", async () => {
    const uploadResponse = await request(app).post("/upload").attach("file", samplePdfPath);
    fs.rmSync(path.join(uploadsDirectory, `${uploadResponse.body.id}.pdf`), { force: true });

    const response = await request(app).get(`/files/${uploadResponse.body.id}/download`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "File not found on disk." });
  });
});
