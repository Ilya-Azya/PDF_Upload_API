import "dotenv/config";
import path from "path";

const projectRoot = path.resolve(__dirname, "..");

function resolveUploadsDirectory(rawPath: string | undefined): string {
  const uploadsPath = rawPath?.trim() || "uploads";
  return path.isAbsolute(uploadsPath)
    ? uploadsPath
    : path.resolve(projectRoot, uploadsPath);
}

function resolvePort(rawPort: string | undefined): number {
  const parsedPort = Number(rawPort);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    return 3000;
  }

  return parsedPort;
}

export const config = {
  port: resolvePort(process.env.PORT),
  uploadsDirectory: resolveUploadsDirectory(process.env.UPLOADS_DIR),
};
