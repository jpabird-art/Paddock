import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, generateBackupCodes } from "@/lib/totp";
import QRCode from "qrcode";
import { audit } from "@/lib/audit";

/**
 * POST /api/auth/mfa/setup
 * Generate a new TOTP secret + QR code for the current user.
 * Does NOT enable MFA yet — that happens after the user confirms with /verify.
 */
export async function POST() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { mfaEnabled: true, serviceNumber: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.mfaEnabled) {
    return NextResponse.json(
      { error: "MFA is already enabled. Disable it first to reconfigure." },
      { status: 400 }
    );
  }

  const { secret, uri } = generateTotpSecret(user.serviceNumber);
  const backupCodes = generateBackupCodes();
  const qrDataUrl = await QRCode.toDataURL(uri);

  // Store the secret and backup codes (MFA not yet active until /verify)
  await prisma.user.update({
    where: { id: session!.user.id },
    data: { totpSecret: secret, backupCodes },
  });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "auth",
    entityId: session!.user.id,
    action: "mfa_setup_initiated",
  });

  return NextResponse.json({
    qrCode: qrDataUrl,
    secret,
    backupCodes,
  });
}
