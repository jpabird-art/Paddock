import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { newAccountToken } from "@/lib/account-security";

// Explicit opt-in, loopback only; never point these tests at a customer database.
const first = process.env.TEST_DATABASE_URL, second = process.env.TEST_OTHER_DATABASE_URL;
const enabled = Boolean(first && second);
for (const url of [first, second]) if (url && !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Integration databases must be local");
describe.skipIf(!enabled)("account lifecycle across two local Paddocks", () => {
  let db: PrismaClient, other: PrismaClient;
  let redeem: typeof import("@/lib/account-tokens").redeemAccountToken;
  let userId: string, otherId: string;
  const email = `${randomUUID()}@example.invalid`;
  beforeAll(async () => {
    process.env.DATABASE_URL = first!;
    db = (await import("@/lib/prisma")).prisma;
    other = new PrismaClient({ datasources: { db: { url: second! } } });
    redeem = (await import("@/lib/account-tokens")).redeemAccountToken;
    const data = { name: "Integration user", email, serviceNumber: randomUUID(), passwordHash: await bcrypt.hash("Initial-test-password", 4), role: "ADMIN" as const };
    userId = (await db.user.create({ data })).id;
    otherId = (await other.user.create({ data })).id;
  });
  afterAll(async () => {
    if (userId) { await db.auditLog.deleteMany({ where: { userId } }); await db.user.delete({ where: { id: userId } }); }
    if (otherId) await other.user.delete({ where: { id: otherId } });
    await db?.$disconnect(); await other?.$disconnect();
  });
  async function issue(expiresAt = new Date(Date.now() + 60000)) {
    const token = newAccountToken();
    await db.accountToken.create({ data: { userId, tokenHash: token.tokenHash, expiresAt, purpose: "reset" } });
    return token;
  }
  it("uses each database's own users and tokens", async () => {
    expect(await other.user.findUnique({ where: { id: userId } })).toBeNull();
    const token = await issue();
    expect(await other.accountToken.findUnique({ where: { tokenHash: token.tokenHash } })).toBeNull();
  });
  it("rejects expired links and disabled users", async () => {
    expect(await redeem((await issue(new Date(0))).token, "Replacement-password-1")).toBe(false);
    await db.user.update({ where: { id: userId }, data: { isActive: false } });
    expect(await redeem((await issue()).token, "Replacement-password-1")).toBe(false);
    await db.user.update({ where: { id: userId }, data: { isActive: true } });
  });
  it("consumes a link once, invalidates outstanding links and revokes sessions", async () => {
    const old = await issue(), token = await issue();
    const results = await Promise.all([redeem(token.token, "Replacement-password-1"), redeem(token.token, "Replacement-password-1")]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await redeem(old.token, "Replacement-password-2")).toBe(false);
    const current = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(current.sessionVersion).toBe(1);
    expect(await bcrypt.compare("Replacement-password-1", current.passwordHash)).toBe(true);
    expect((await other.user.findUniqueOrThrow({ where: { id: otherId } })).sessionVersion).toBe(0);
  });
});
