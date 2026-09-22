import { prisma } from "@/lib/prisma";
import { accountOrigin, hashAccountToken, newAccountToken, passwordSchema } from "@/lib/account-security";
import { sendEmail } from "@/lib/email";
import { getSiteConfig } from "@/lib/site-config";
import bcrypt from "bcryptjs";

type Purpose = "invite" | "reset";
export async function sendAccountLink(user: { id: string; email: string; serviceNumber: string }, purpose: Purpose) {
  const origin = accountOrigin();
  const { token, tokenHash } = newAccountToken();
  const hours = purpose === "invite" ? 48 : 1;
  const record = await prisma.accountToken.create({ data: {
    userId: user.id, tokenHash, purpose, expiresAt: new Date(Date.now() + hours * 3600000),
  }});
  // Fragment keeps tokens out of HTTP access logs and Referer headers.
  const url = `${origin}/account/password#token=${token}`;
  const org = getSiteConfig().orgName ?? "Paddock";
  const sent = await sendEmail({ to: user.email,
    subject: purpose === "invite" ? `Your invitation to ${org}` : `Reset your ${org} password`,
    text: `${purpose === "invite" ? "You have been invited to" : "A password reset was requested for"} ${org}.\n\nSet your password: ${url}\n\nYour username is ${user.serviceNumber}. This link expires in ${hours} hour(s) and can be used once. Your authenticator remains required if MFA is enabled. If you did not expect this email, you can ignore it.`,
  });
  if (!sent) await prisma.accountToken.deleteMany({ where: { id: record.id } });
  return sent;
}
export async function redeemAccountToken(token: string, password: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return false;
  const passwordHash = await bcrypt.hash(parsed.data, 12);
  return prisma.$transaction(async tx => {
    const record = await tx.accountToken.findUnique({ where: { tokenHash: hashAccountToken(token) } });
    if (!record || record.expiresAt <= new Date()) return false;
    // Serialize redemption for this user, including two different outstanding links.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${record.userId} FOR UPDATE`;
    // Conditional DELETE provides single consumption even with concurrent requests.
    const claimed = await tx.accountToken.deleteMany({ where: { id: record.id, expiresAt: { gt: new Date() } } });
    if (claimed.count !== 1) return false;
    const result = await tx.user.updateMany({
      where: { id: record.userId, isActive: true },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    if (result.count !== 1) return false;
    await tx.accountToken.deleteMany({ where: { userId: record.userId } });
    await tx.auditLog.create({ data: { userId: record.userId, entityType: "user", entityId: record.userId, action: record.purpose === "invite" ? "invitation_accepted" : "password_reset" } });
    return true;
  });
}
