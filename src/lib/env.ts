/**
 * Runtime environment validation.
 * Imported early to fail fast if required vars are missing.
 * Skipped during Next.js build phase (page data collection) where
 * runtime secrets like DATABASE_URL are not yet available.
 */

const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build";

function required(name: string): string {
  const value = process.env[name];
  if (!value && !isBuildPhase) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  NEXTAUTH_SECRET: required("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  get isProduction() {
    return this.NODE_ENV === "production";
  },
} as const;
