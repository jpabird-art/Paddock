import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { storage } from "@/lib/storage";
const dirs: string[] = [];
afterEach(async () => { vi.unstubAllEnvs(); for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true }); });
describe("isolated persistent uploads", () => {
  it("resolves stable file keys within each tenant volume", async () => {
    const a = await mkdtemp(path.join(tmpdir(), "paddock-a-")), b = await mkdtemp(path.join(tmpdir(), "paddock-b-")); dirs.push(a,b);
    vi.stubEnv("UPLOAD_DIR", a); const key = await storage.write("passport.pdf", Buffer.from("tenant A"));
    expect((await storage.read(key))?.toString()).toBe("tenant A");
    vi.stubEnv("UPLOAD_DIR", b); expect(await storage.read(key)).toBeNull();
    vi.stubEnv("UPLOAD_DIR", a); expect((await storage.read(key))?.toString()).toBe("tenant A");
  });
  it("rejects traversal and absolute file deletion", async () => {
    for (const key of ["uploads/../../package.json", "/etc/passwd", "uploads/../secret", "uploads/a/secret"]) {
      expect(await storage.read(key)).toBeNull();
      await expect(storage.remove(key)).rejects.toThrow("Invalid storage path");
    }
  });
});
