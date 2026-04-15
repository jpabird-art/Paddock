import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";
import { z } from "zod";
import { audit } from "@/lib/audit";

const schema = z.object({
  code: z.string().length(6),
});

/**
 * POST /api/auth/mfa/verify
 * Confirm MFA setup by verifying a TOTP code. Enables MFA on success.
 */
export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Provide a 6-digit code" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { totpSecret: true, mfaEnabled: true },
  });

  if (!user || !user.totpSecret) {
    return NextResponse.json(
      { error: "Run MFA setup first" },
      { status: 400 }
    );
  }

  if (user.mfaEnabled) {
    return NextResponse.json({ error: "MFA is already enabled" }, { status: 400 });
  }

  const valid = verifyTotp(parse.data.code, user.totpSecret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session!.user.id },
    data: { mfaEnabled: true },
  });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "auth",
    entityId: session!.user.id,
    action: "mfa_enabled",
  });

  return NextResponse.json({ success: true });
}
