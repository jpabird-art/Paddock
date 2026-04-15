import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  serviceNumber: z.string().min(1),
});

/**
 * POST /api/auth/mfa/check
 * Check whether a service number has MFA enabled (pre-login, no auth required).
 * Only returns a boolean — does not leak user existence (always returns false for unknown users).
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ mfaRequired: false });
  }

  const user = await prisma.user.findUnique({
    where: { serviceNumber: parse.data.serviceNumber.toUpperCase() },
    select: { mfaEnabled: true },
  });

  return NextResponse.json({ mfaRequired: user?.mfaEnabled ?? false });
}
