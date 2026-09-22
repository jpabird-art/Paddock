import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

// bcrypt uses at most 72 bytes. Reject rather than silently truncate passwords.
export const passwordSchema = z.string().min(12, "Use at least 12 characters")
  .refine(value => Buffer.byteLength(value, "utf8") <= 72, "Use at most 72 UTF-8 bytes");
export function newAccountToken() {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashAccountToken(token) };
}
export function hashAccountToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function accountOrigin() {
  const url = new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  if (url.username || url.password || (url.protocol !== "https:" &&
    !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new Error("NEXTAUTH_URL must be the trusted HTTPS address of this Paddock");
  }
  return url.origin;
}
export function assertCurrentSession(user: { isActive: boolean; sessionVersion: number } | null, version: unknown) {
  if (!user?.isActive || user.sessionVersion !== version) throw new Error("Session revoked; sign in again");
}
