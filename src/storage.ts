import { FileMetadata } from "./types";

const files: FileMetadata[] = [];

export const storage = {
  add(file: FileMetadata): void {
    files.push(file);
  },

  getAll(): FileMetadata[] {
    return [...files];
  },

  getById(id: string): FileMetadata | undefined {
    return files.find((file) => file.id === id);
  },

  clear(): void {
    files.length = 0;
  },
};
