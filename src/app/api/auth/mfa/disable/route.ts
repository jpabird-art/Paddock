import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { audit } from "@/lib/audit";

const schema = z.object({
  password: z.string().min(1),
});

/**
 * POST /api/auth/mfa/disable
 * Disable MFA for the current user. Requires password confirmation.
 */
export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { passwordHash: true, mfaEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.mfaEnabled) {
    return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
  }

  const passwordValid = await bcrypt.compare(parse.data.password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: session!.user.id },
    data: { mfaEnabled: false, totpSecret: null, backupCodes: [] },
  });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "auth",
    entityId: session!.user.id,
    action: "mfa_disabled",
  });

  return NextResponse.json({ success: true });
}
