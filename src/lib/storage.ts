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

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const localBackend: StorageBackend = {
  async write(fileName: string, buffer: Buffer): Promise<string> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(fileName) || "";
    const safeFileName = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, safeFileName), buffer);
    return `uploads/${safeFileName}`;
  },

  async read(storagePath: string): Promise<Buffer | null> {
    try {
      return await readFile(path.join(process.cwd(), storagePath));
    } catch {
      return null;
    }
  },

  async remove(storagePath: string): Promise<void> {
    try {
      await unlink(path.join(process.cwd(), storagePath));
    } catch {
      // File already gone — fine
    }
  },
};

export const storage: StorageBackend = localBackend;
