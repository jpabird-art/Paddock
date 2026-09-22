import { afterEach, describe, expect, it, vi } from "vitest";
import { accountOrigin, assertCurrentSession, hashAccountToken, newAccountToken, passwordSchema } from "@/lib/account-security";
import { rateLimit } from "@/lib/rate-limit";

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
describe("account security", () => {
  it("issues random bearer tokens but stores only a SHA-256 digest", () => {
    const first = newAccountToken(), second = newAccountToken();
    expect(first.token).toMatch(/^[a-f0-9]{64}$/);
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).toBe(hashAccountToken(first.token));
    expect(first.tokenHash).not.toBe(first.token);
  });
  it("rejects short passwords and bcrypt truncation, including multibyte text", () => {
    expect(passwordSchema.safeParse("a".repeat(11)).success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(72)).success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false);
    expect(passwordSchema.safeParse("🐴".repeat(20)).success).toBe(false);
  });
  it("rejects deleted, inactive, pre-migration and revoked sessions", () => {
    expect(() => assertCurrentSession(null, 0)).toThrow();
    expect(() => assertCurrentSession({ isActive: false, sessionVersion: 0 }, 0)).toThrow();
    expect(() => assertCurrentSession({ isActive: true, sessionVersion: 0 }, undefined)).toThrow();
    expect(() => assertCurrentSession({ isActive: true, sessionVersion: 2 }, 1)).toThrow();
    expect(() => assertCurrentSession({ isActive: true, sessionVersion: 2 }, 2)).not.toThrow();
  });
  it("uses the configured HTTPS origin for recovery links in production", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXTAUTH_URL", "https://cairnhead.paddock-ltd.com/path");
    expect(accountOrigin()).toBe("https://cairnhead.paddock-ltd.com");
    vi.stubEnv("NEXTAUTH_URL", "http://cairnhead.paddock-ltd.com"); expect(accountOrigin).toThrow();
    vi.stubEnv("NEXTAUTH_URL", "https://user:password@example.com"); expect(accountOrigin).toThrow();
  });
  it("keeps limits for their full window", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-22T12:00:00Z"));
    expect(rateLimit("window-test", 1, 900000).allowed).toBe(true);
    vi.advanceTimersByTime(360000);
    expect(rateLimit("window-test", 1, 900000).allowed).toBe(false);
    vi.advanceTimersByTime(600000);
    expect(rateLimit("window-test", 1, 900000).allowed).toBe(true);
  });
});

describe("marketing environment", () => {
  it("loads without a tenant database connection", async () => {
    vi.resetModules(); vi.stubEnv("PADDOCK_SITE_MODE", "marketing"); vi.stubEnv("DATABASE_URL", "");
    const { env } = await import("@/lib/env");
    expect(env.DATABASE_URL).toBe("");
  });
});
