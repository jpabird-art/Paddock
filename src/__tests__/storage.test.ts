import { describe, it, expect, afterAll } from "vitest";
import { storage } from "@/lib/storage";
import { rmdir, unlink } from "fs/promises";
import path from "path";

const TEST_UPLOAD_DIR = path.join(process.cwd(), "uploads");
const createdFiles: string[] = [];

afterAll(async () => {
  for (const f of createdFiles) {
    try { await unlink(path.join(process.cwd(), f)); } catch { /* ignore */ }
  }
  try { await rmdir(TEST_UPLOAD_DIR); } catch { /* ignore if not empty or missing */ }
});

describe("storage", () => {
  it("writes and reads a file", async () => {
    const content = Buffer.from("hello paddock");
    const storagePath = await storage.write("test-file.txt", content);
    createdFiles.push(storagePath);

    expect(storagePath).toMatch(/^uploads\/[a-f0-9-]+\.txt$/);

    const result = await storage.read(storagePath);
    expect(result).not.toBeNull();
    expect(result!.toString()).toBe("hello paddock");
  });

  it("returns null for missing file", async () => {
    const result = await storage.read("uploads/nonexistent.txt");
    expect(result).toBeNull();
  });

  it("removes a file without error", async () => {
    const content = Buffer.from("to be deleted");
    const storagePath = await storage.write("delete-me.txt", content);

    await storage.remove(storagePath);

    const result = await storage.read(storagePath);
    expect(result).toBeNull();
  });

  it("remove silently ignores missing files", async () => {
    await expect(storage.remove("uploads/does-not-exist.txt")).resolves.toBeUndefined();
  });
});
