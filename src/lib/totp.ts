import * as OTPAuth from "otpauth";
import crypto from "crypto";

const ISSUER = "Paddock HCMR";

/**
 * Generate a new TOTP secret for a user.
 */
export function generateTotpSecret(serviceNumber: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: serviceNumber,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Verify a TOTP token against a stored base32 secret.
 * Allows a window of +/- 1 period (30s) to account for clock drift.
 */
export function verifyTotp(token: string, base32Secret: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(base32Secret),
  });

  // Returns null if invalid, or the delta (time step difference) if valid
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

/**
 * Generate a set of single-use backup codes.
 */
export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
}

/**
 * Check if a code matches one of the backup codes.
 * Returns the remaining codes (with the used one removed), or null if no match.
 */
export function consumeBackupCode(
  code: string,
  storedCodes: string[]
): string[] | null {
  const normalised = code.toUpperCase().replace(/\s/g, "");
  const index = storedCodes.indexOf(normalised);
  if (index === -1) return null;
  return storedCodes.filter((_, i) => i !== index);
}
