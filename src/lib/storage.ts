/**
 * File storage abstraction.
 *
 * Currently uses local filesystem. To migrate to S3/R2, implement the
 * StorageBackend interface and swap the export below.
 */

import { writeFile, readFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface StorageBackend {
  /** Write a file and return its relative storage path. */
  write(fileName: string, buffer: Buffer): Promise<string>;
  /** Read a file by its storage path. Returns null if not found. */
  read(storagePath: string): Promise<Buffer | null>;
  /** Delete a file by its storage path. Silently ignores missing files. */
  remove(storagePath: string): Promise<void>;
}

function uploadDir() { return path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads")); }
function filePath(storagePath: string) {
  if (!/^uploads\/[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9]+)?$/.test(storagePath)) throw new Error("Invalid storage path");
  return path.join(uploadDir(), storagePath.slice("uploads/".length));
}

const localBackend: StorageBackend = {
  async write(fileName: string, buffer: Buffer): Promise<string> {
    await mkdir(uploadDir(), { recursive: true });
    const rawExt = path.extname(fileName);
    const ext = /^\.[a-zA-Z0-9]+$/.test(rawExt) ? rawExt : "";
    const safeFileName = `${randomUUID()}${ext}`;
    await writeFile(path.join(uploadDir(), safeFileName), buffer);
    return `uploads/${safeFileName}`;
  },

  async read(storagePath: string): Promise<Buffer | null> {
    try {
      return await readFile(filePath(storagePath));
    } catch {
      return null;
    }
  },

  async remove(storagePath: string): Promise<void> {
    const target = filePath(storagePath);
    try {
      await unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  },
};

export const storage: StorageBackend = localBackend;
