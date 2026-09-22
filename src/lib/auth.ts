import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTotp, consumeBackupCode } from "@/lib/totp";
import { assertCurrentSession } from "@/lib/account-security";
import { audit } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        serviceNumber: { label: "Service Number", type: "text" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "MFA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.serviceNumber || !credentials?.password) {
          return null;
        }

        if (process.env.PADDOCK_SITE_MODE === "marketing") return null;
        const login = credentials.serviceNumber.trim();
        const user = await prisma.user.findFirst({
          where: login.includes("@") ? { email: login.toLowerCase() } : { serviceNumber: login.toUpperCase() },
        });

        if (!user || !user.isActive) {
          audit({
            entityType: "auth",
            entityId: credentials.serviceNumber.toUpperCase(),
            action: "login_failed",
            metadata: { reason: user ? "inactive_account" : "unknown_user" },
          });
          return null;
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordValid) {
          audit({
            userId: user.id,
            userRole: user.role,
            entityType: "auth",
            entityId: user.id,
            action: "login_failed",
            metadata: { reason: "invalid_password" },
          });
          return null;
        }

        // MFA check — if user has MFA enabled, require a valid TOTP code
        if (user.mfaEnabled && user.totpSecret) {
          const code = credentials.totpCode?.trim();
          if (!code) {
            // Signal to the client that MFA is required
            throw new Error("MFA_REQUIRED");
          }

          // Try TOTP first, then backup codes
          const totpValid = verifyTotp(code, user.totpSecret);
          if (!totpValid) {
            const remaining = consumeBackupCode(code, user.backupCodes);
            if (remaining === null) {
              audit({
                userId: user.id,
                userRole: user.role,
                entityType: "auth",
                entityId: user.id,
                action: "mfa_failed",
                metadata: { reason: "invalid_code" },
              });
              throw new Error("MFA_INVALID");
            }
            // Valid backup code — remove it from the list
            await prisma.user.update({
              where: { id: user.id },
              data: { backupCodes: remaining },
            });
          }
        }

        audit({
          userId: user.id,
          userRole: user.role,
          entityType: "auth",
          entityId: user.id,
          action: "login_success",
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          squadron: user.squadron,
          serviceNumber: user.serviceNumber,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.squadron = (user as { squadron: string | null }).squadron;
        token.serviceNumber = (user as { serviceNumber: string }).serviceNumber;
        token.id = user.id;
      }
      if (user) token.sessionVersion = (user as { sessionVersion: number }).sessionVersion;
      const current = await prisma.user.findUnique({ where: { id: token.id },
        select: { isActive: true, sessionVersion: true, role: true, squadron: true, serviceNumber: true, name: true, email: true } });
      assertCurrentSession(current, token.sessionVersion);
      token.role = current!.role;
      token.squadron = current!.squadron;
      token.name = current!.name;
      token.email = current!.email;
      token.serviceNumber = current!.serviceNumber;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.squadron = (token.squadron as string | null) ?? null;
        session.user.serviceNumber = token.serviceNumber as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
